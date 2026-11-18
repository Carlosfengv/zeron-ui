function binding(sourceCode, node, name) {
  for (let scope = sourceCode.getScope(node); scope; scope = scope.upper) {
    const variable = scope.set.get(name);
    if (variable) return variable.defs[0];
  }
}

function importedComponent(sourceCode, node, patterns) {
  const opening = node.openingElement;
  if (!opening) return null;
  if (opening.name.type === "JSXIdentifier") {
    const definition = binding(sourceCode, node, opening.name.name);
    if (definition?.type !== "ImportBinding") return null;
    if (!patterns.some((pattern) => pattern.test(definition.parent.source.value))) return null;
    return definition.node.imported?.name ?? null;
  }
  if (
    opening.name.type === "JSXMemberExpression" &&
    opening.name.object.type === "JSXIdentifier" &&
    opening.name.property.type === "JSXIdentifier"
  ) {
    const definition = binding(sourceCode, node, opening.name.object.name);
    if (
      definition?.type !== "ImportBinding" ||
      definition.node.type !== "ImportNamespaceSpecifier" ||
      !patterns.some((pattern) => pattern.test(definition.parent.source.value))
    ) {
      return null;
    }
    return opening.name.property.name;
  }
  return null;
}

function nonEmptyJsxChildren(node) {
  return (node.children ?? []).filter(
    (child) =>
      !(child.type === "JSXText" && !child.value.trim()) &&
      !(child.type === "JSXExpressionContainer" && child.expression.type === "JSXEmptyExpression"),
  );
}

function extractJsxFromExpression(expr) {
  if (!expr) return [];
  if (expr.type === "JSXElement") return [expr];
  if (expr.type === "JSXFragment") return unwrapDirectJsxElements(nonEmptyJsxChildren(expr));
  if (expr.type === "LogicalExpression") {
    return [...extractJsxFromExpression(expr.left), ...extractJsxFromExpression(expr.right)];
  }
  if (expr.type === "ConditionalExpression") {
    return [
      ...extractJsxFromExpression(expr.consequent),
      ...extractJsxFromExpression(expr.alternate),
    ];
  }
  if (expr.type === "SequenceExpression") {
    return extractJsxFromExpression(expr.expressions.at(-1));
  }
  return [];
}

function unwrapDirectJsxElements(nodes) {
  const result = [];
  for (const node of nodes) {
    if (node.type === "JSXElement") result.push(node);
    else if (node.type === "JSXFragment") {
      result.push(...unwrapDirectJsxElements(nonEmptyJsxChildren(node)));
    } else if (node.type === "JSXExpressionContainer") {
      result.push(...extractJsxFromExpression(node.expression));
    }
  }
  return result;
}

function hasInsidePageContentAncestor(node, sourceCode, patterns) {
  for (let current = node.parent; current; current = current.parent) {
    if (current.type === "JSXElement") {
      const ancestor = importedComponent(sourceCode, current, patterns);
      if (ancestor === "PageContent" || ancestor === "PageBody") return true;
    }
  }
  return false;
}

const slotChildren = {
  AppShell: new Set(["AppShellSidebar", "AppShellHeader", "AppShellMain"]),
  PageLayout: new Set(["PageSidebar", "PageContent"]),
  PageContentHeader: new Set(["PageSubnav", "PageActions"]),
  PageColumns: new Set(["PagePrimary", "PageAside"]),
};

function findWrappedSlots(sourceCode, elements, parentComponent, expectedSlots, patterns, firstHostWrapper = null) {
  const findings = [];
  for (const element of elements) {
    const comp = importedComponent(sourceCode, element, patterns);
    if (comp) {
      // Stop descending if a nested independent Zeron owner of the same family is mounted
      if (comp === parentComponent) continue;
      if (firstHostWrapper && expectedSlots.has(comp)) {
        findings.push({ wrapperNode: firstHostWrapper.node, wrapperName: firstHostWrapper.name, slot: comp });
        continue;
      }
      // Do not cross into custom/imported React components when looking for native DOM wrappers
      continue;
    }
    const opening = element.openingElement;
    if (opening.name.type !== "JSXIdentifier") continue;
    const tagName = opening.name.name;
    // Only trace native lowercase HTML elements (div, section, main, etc.) that create intermediate DOM nodes
    if (!/^[a-z]/.test(tagName)) continue;
    const wrapper = firstHostWrapper ?? { node: opening, name: tagName };
    const nested = unwrapDirectJsxElements(nonEmptyJsxChildren(element));
    findings.push(...findWrappedSlots(sourceCode, nested, parentComponent, expectedSlots, patterns, wrapper));
  }
  return findings;
}

export const pageLayoutContracts = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce Zeron PageLayout, PageHeaderContent text grouping, direct-child layout slots, and DataTable surface ownership",
    },
    schema: [],
    messages: {
      ungroupedHeaderText:
        "PageHeaderContent is a horizontal flex row. Wrap sibling PageTitle and PageDescription in a text group container (e.g. <div className=\"min-w-0\">) so they stack vertically.",
      cardWrappedDataTable:
        "Do not wrap DataTable directly in a Card or Container frame. DataTable owns its surface and border inside PageContent > PageBody.",
      wrappedDirectSlot:
        "{{slot}} must be a direct DOM child of {{parent}} (or separated only by a React Fragment) so {{parent}}'s direct-child [data-slot] selectors work. Remove intermediate <{{wrapper}}>.",
    },
  },
  create(context) {
    const sourceCode = context.sourceCode;
    const patterns = (
      context.settings.shadcn?.componentImports ?? ["^@zeron/ui(/|$)", "^@/components/ui(/|$)"]
    ).map((value) => new RegExp(value));

    return {
      JSXElement(node) {
        const component = importedComponent(sourceCode, node, patterns);
        if (!component) return;

        if (component === "PageHeaderContent") {
          const directElements = unwrapDirectJsxElements(nonEmptyJsxChildren(node));
          const titles = directElements.filter(
            (child) => importedComponent(sourceCode, child, patterns) === "PageTitle",
          );
          const descriptions = directElements.filter(
            (child) => importedComponent(sourceCode, child, patterns) === "PageDescription",
          );
          if (titles.length > 0 && descriptions.length > 0) {
            context.report({ node: descriptions[0], messageId: "ungroupedHeaderText" });
          }
        }

        if (
          (component === "Card" ||
            component === "CardContent" ||
            component === "Container" ||
            component === "ContainerBody") &&
          (component === "Card" || component === "CardContent" || hasInsidePageContentAncestor(node, sourceCode, patterns))
        ) {
          const directElements = unwrapDirectJsxElements(nonEmptyJsxChildren(node));
          for (const child of directElements) {
            if (importedComponent(sourceCode, child, patterns) === "DataTable") {
              context.report({ node: child, messageId: "cardWrappedDataTable" });
            }
          }
        }

        if (Object.hasOwn(slotChildren, component)) {
          const expectedSlots = slotChildren[component];
          const directElements = unwrapDirectJsxElements(nonEmptyJsxChildren(node));
          const wrapped = findWrappedSlots(sourceCode, directElements, component, expectedSlots, patterns);
          for (const item of wrapped) {
            context.report({
              node: item.wrapperNode,
              messageId: "wrappedDirectSlot",
              data: { slot: item.slot, parent: component, wrapper: item.wrapperName },
            });
          }
        }
      },
    };
  },
};

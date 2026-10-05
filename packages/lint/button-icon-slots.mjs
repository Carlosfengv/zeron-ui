function binding(sourceCode, node, name) {
  for (let scope = sourceCode.getScope(node); scope; scope = scope.upper) {
    const variable = scope.set.get(name);
    if (variable) return variable.defs[0];
  }
}
function imported(sourceCode, node, name) {
  const definition = binding(sourceCode, node, name);
  return definition?.type === "ImportBinding" ? definition : undefined;
}
const iconModule = /^(?:lucide-react|@hugeicons\/react|@hugeicons\/core-free-icons)$/;

export const buttonIconSlots = {
  meta: {
    type: "problem",
    docs: { description: "Use public icon slots for standard labeled Zeron Buttons" },
    schema: [],
    messages: { iconChild: "普通图文 Button 的图标应通过 leadingIcon/trailingIcon 传入组件类型，children 保留标签；不要用 inline-flex/gap 修复内部 label。iconOnly 和 contentSized 自定义组合单独验收。" },
  },
  create(context) {
    const sourceCode = context.sourceCode;
    const patterns = (context.settings.shadcn?.componentImports ?? ["^@zeron/ui(/|$)", "^@/components/ui(/|$)"]).map(value => new RegExp(value));
    const isIcon = element => {
      const name = element.openingElement.name;
      if (name.type === "JSXIdentifier") {
        if (name.name === "svg") return true;
        const definition = binding(sourceCode, element, name.name);
        if (definition?.type === "ImportBinding") return iconModule.test(definition.parent.source.value);
        if (definition?.type !== "Variable" || definition.node.init?.type !== "CallExpression") return false;
        const callee = definition.node.init.callee;
        if (callee.type !== "Identifier") return false;
        const hook = imported(sourceCode, element, callee.name);
        return hook?.node.imported?.name === "useIcon" && (hook.parent.source.value === "@zeron/icons/context" || /(?:^|\/)icon-context$/.test(hook.parent.source.value));
      }
      if (name.type === "JSXMemberExpression" && name.object.type === "JSXIdentifier") {
        const definition = imported(sourceCode, element, name.object.name);
        return definition?.node.type === "ImportNamespaceSpecifier" && iconModule.test(definition.parent.source.value);
      }
      return false;
    };
    return {
      JSXElement(node) {
        const opening = node.openingElement;
        if (opening.name.type !== "JSXIdentifier") return;
        const definition = imported(sourceCode, node, opening.name.name);
        if (definition?.node.imported?.name !== "Button" || !patterns.some(pattern => pattern.test(definition.parent.source.value))) return;
        // Spreads and dynamic opt-ins need runtime interpretation, not a guessed contract.
        if (opening.attributes.some(attr => attr.type === "JSXSpreadAttribute" || (attr.type === "JSXAttribute" && ["iconOnly", "contentSized", "asChild"].includes(attr.name.name) && !(attr.value?.type === "JSXExpressionContainer" && attr.value.expression.type === "Literal" && attr.value.expression.value === false)))) return;
        const children = node.children.filter(child => !(child.type === "JSXText" && !child.value.trim()) && !(child.type === "JSXExpressionContainer" && child.expression.type === "JSXEmptyExpression"));
        const icons = children.filter(child => child.type === "JSXElement" && isIcon(child));
        const label = children.some(child => child.type === "JSXText" || (child.type === "JSXExpressionContainer" && !["JSXElement", "JSXFragment"].includes(child.expression.type)));
        if (label) for (const icon of icons) context.report({ node: icon, messageId: "iconChild" });
      },
    };
  },
};

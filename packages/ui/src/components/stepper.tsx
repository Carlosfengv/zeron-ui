"use client";

import { useDirection } from "@base-ui/react/direction-provider";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import { useAsRef } from "#hooks/use-as-ref";
import { useIsomorphicLayoutEffect } from "#hooks/use-isomorphic-layout-effect";
import { useLazyRef } from "#hooks/use-lazy-ref";
import { useComposedRefs } from "#system/compose-refs";
import { cn } from "#system/utils";
import { useIcon } from "#system/icon-context";

const ROOT_NAME = "Stepper";
const LIST_NAME = "StepperList";
const ITEM_NAME = "StepperItem";
const TRIGGER_NAME = "StepperTrigger";
const INDICATOR_NAME = "StepperIndicator";
const TITLE_NAME = "StepperTitle";
const DESCRIPTION_NAME = "StepperDescription";
const CONTENT_NAME = "StepperContent";
const PREV_NAME = "StepperPrev";
const NEXT_NAME = "StepperNext";

const ENTRY_FOCUS = "stepperFocusGroup.onEntryFocus";
const EVENT_OPTIONS = { bubbles: false, cancelable: true };
const ARROW_KEYS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

type Direction = "ltr" | "rtl";
type Orientation = "horizontal" | "vertical";
type NavigationDirection = "next" | "prev";
type ActivationMode = "automatic" | "manual";
type DataState = "inactive" | "active" | "completed";

interface DivProps
  extends React.ComponentProps<"div">,
    useRender.ComponentProps<"div"> {}
interface ButtonProps
  extends React.ComponentProps<"button">,
    useRender.ComponentProps<"button"> {}

type ListElement = HTMLDivElement;
type TriggerElement = HTMLButtonElement;

function getId(
  id: string,
  variant: "trigger" | "content" | "title" | "description",
  value: string,
) {
  return `${id}-${variant}-${value}`;
}

type FocusIntent = "first" | "last" | "prev" | "next";

const MAP_KEY_TO_FOCUS_INTENT: Record<string, FocusIntent> = {
  ArrowLeft: "prev",
  ArrowUp: "prev",
  ArrowRight: "next",
  ArrowDown: "next",
  PageUp: "first",
  Home: "first",
  PageDown: "last",
  End: "last",
};

function getDirectionAwareKey(key: string, dir?: Direction) {
  if (dir !== "rtl") return key;
  return key === "ArrowLeft"
    ? "ArrowRight"
    : key === "ArrowRight"
      ? "ArrowLeft"
      : key;
}

function getFocusIntent(
  event: React.KeyboardEvent<TriggerElement>,
  dir?: Direction,
  orientation?: Orientation,
) {
  const key = getDirectionAwareKey(event.key, dir);
  if (orientation === "horizontal" && ["ArrowUp", "ArrowDown"].includes(key))
    return undefined;
  if (orientation === "vertical" && ["ArrowLeft", "ArrowRight"].includes(key))
    return undefined;
  return MAP_KEY_TO_FOCUS_INTENT[key];
}

function focusFirst(
  candidates: React.RefObject<TriggerElement | null>[],
  preventScroll = false,
) {
  const PREVIOUSLY_FOCUSED_ELEMENT = document.activeElement;
  for (const candidateRef of candidates) {
    const candidate = candidateRef.current;
    if (!candidate) continue;
    if (candidate === PREVIOUSLY_FOCUSED_ELEMENT) return;
    candidate.focus({ preventScroll });
    if (document.activeElement !== PREVIOUSLY_FOCUSED_ELEMENT) return;
  }
}

function wrapArray<T>(array: T[], startIndex: number) {
  return array.map<T>(
    (_, index) => array[(startIndex + index) % array.length] as T,
  );
}

function getDataState(
  value: string | undefined,
  itemValue: string,
  stepState: StepState | undefined,
  steps: Map<string, StepState>,
  variant: "item" | "separator" = "item",
): DataState {
  const stepKeys = Array.from(steps.keys());
  const currentIndex = stepKeys.indexOf(itemValue);

  if (stepState?.completed) return "completed";

  if (value === itemValue) {
    return variant === "separator" ? "inactive" : "active";
  }

  if (value) {
    const activeIndex = stepKeys.indexOf(value);

    if (activeIndex > currentIndex) return "completed";
  }

  return "inactive";
}

interface StepState {
  value: string;
  completed: boolean;
  disabled: boolean;
}

interface StoreState {
  steps: Map<string, StepState>;
  value: string;
}

interface Store {
  subscribe: (callback: () => void) => () => void;
  getState: () => StoreState;
  getNavigationIntent: () => number;
  setState: <K extends keyof StoreState>(key: K, value: StoreState[K]) => void;
  setStateWithValidation: (
    value: string,
    direction: NavigationDirection,
  ) => Promise<boolean>;
  hasValidation: () => boolean;
  notify: () => void;
  addStep: (value: string, completed: boolean, disabled: boolean) => void;
  removeStep: (value: string) => void;
  setStep: (value: string, completed: boolean, disabled: boolean) => void;
}

const StoreContext = React.createContext<Store | null>(null);

function useStoreContext(consumerName: string) {
  const context = React.useContext(StoreContext);
  if (!context) {
    throw new Error(`\`${consumerName}\` must be used within \`${ROOT_NAME}\``);
  }
  return context;
}

function useStore<T>(selector: (state: StoreState) => T): T {
  const store = useStoreContext("useStore");

  const getSnapshot = React.useCallback(
    () => selector(store.getState()),
    [store, selector],
  );

  return React.useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}

interface ItemData {
  id: string;
  ref: React.RefObject<TriggerElement | null>;
  value: string;
  active: boolean;
  disabled: boolean;
}

interface StepperContextValue {
  isMountedRef: React.RefObject<boolean>;
  validatedFocusRef: React.RefObject<string | null>;
  rootId: string;
  dir: Direction;
  orientation: Orientation;
  activationMode: ActivationMode;
  disabled: boolean;
  nonInteractive: boolean;
  loop: boolean;
}

const StepperContext = React.createContext<StepperContextValue | null>(null);

function useStepperContext(consumerName: string) {
  const context = React.useContext(StepperContext);
  if (!context) {
    throw new Error(`\`${consumerName}\` must be used within \`${ROOT_NAME}\``);
  }
  return context;
}

interface StepperProps extends DivProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onValueComplete?: (value: string, completed: boolean) => void;
  onValueAdd?: (value: string) => void;
  onValueRemove?: (value: string) => void;
  onValidate?: (
    value: string,
    direction: NavigationDirection,
  ) => boolean | Promise<boolean>;
  activationMode?: ActivationMode;
  dir?: Direction;
  orientation?: Orientation;
  disabled?: boolean;
  loop?: boolean;
  nonInteractive?: boolean;
}

function Stepper(props: StepperProps) {
  const {
    value,
    defaultValue,
    onValueChange,
    onValueComplete,
    onValueAdd,
    onValueRemove,
    onValidate,
    dir: dirProp,
    orientation = "horizontal",
    activationMode = "automatic",
    render,
    disabled = false,
    nonInteractive = false,
    loop = false,
    className,
    id,
    ...rootProps
  } = props;

  const listenersRef = useLazyRef(() => new Set<() => void>());
  const stateRef = useLazyRef<StoreState>(() => ({
    steps: new Map(),
    value: value ?? defaultValue ?? "",
  }));

  const navigationRef = React.useRef(0);
  // Deferred initial focus yields to newer navigation, not mount layout effects.
  const navigationIntentRef = React.useRef(0);
  const pendingNavigationRef = React.useRef<{ source: string; target: string } | null>(null);
  const isMountedRef = React.useRef(false);
  const validatedFocusRef = React.useRef<string | null>(null);

  const propsRef = useAsRef({
    disabled,
    value,
    onValueChange,
    onValueComplete,
    onValueAdd,
    onValueRemove,
    onValidate,
  });

  const store = React.useMemo<Store>(() => {
    return {
      subscribe: (cb) => {
        listenersRef.current.add(cb);
        return () => listenersRef.current.delete(cb);
      },
      getState: () => stateRef.current,
      getNavigationIntent: () => navigationIntentRef.current,
      setState: (key, value) => {
        if (key === "value") {
          navigationRef.current += 1;
          navigationIntentRef.current += 1;
        }
        if (Object.is(stateRef.current[key], value)) return;

        if (key === "value" && typeof value === "string") {
          propsRef.current.onValueChange?.(value);
          if (propsRef.current.value !== undefined) return;
          stateRef.current.value = value;
        } else {
          stateRef.current[key] = value;
        }

        store.notify();
      },
      setStateWithValidation: async (value, direction) => {
        const request = ++navigationRef.current;
        navigationIntentRef.current += 1;
        const canNavigate = () => !propsRef.current.disabled &&
          stateRef.current.steps.has(value) && !stateRef.current.steps.get(value)?.disabled;
        if (!canNavigate()) return false;
        const pendingNavigation = { source: stateRef.current.value, target: value };
        pendingNavigationRef.current = pendingNavigation;
        try {
          const isValid = propsRef.current.onValidate
            ? await propsRef.current.onValidate(value, direction)
            : true;
          if (!isValid || request !== navigationRef.current || !canNavigate()) return false;
          store.setState("value", value);
          return true;
        } catch {
          return false;
        } finally {
          if (pendingNavigationRef.current === pendingNavigation) {
            pendingNavigationRef.current = null;
          }
        }
      },
      hasValidation: () => !!propsRef.current.onValidate,
      addStep: (value, completed, disabled) => {
        const newStep: StepState = { value, completed, disabled };
        const nextSteps = new Map(stateRef.current.steps);
        nextSteps.set(value, newStep);
        stateRef.current.steps = nextSteps;
        propsRef.current.onValueAdd?.(value);
        store.notify();
      },
      removeStep: (value) => {
        const pending = pendingNavigationRef.current;
        if (pending && (value === pending.source || value === pending.target)) {
          navigationRef.current += 1;
        }
        const nextSteps = new Map(stateRef.current.steps);
        nextSteps.delete(value);
        stateRef.current.steps = nextSteps;
        propsRef.current.onValueRemove?.(value);
        store.notify();
      },
      setStep: (value, completed, disabled) => {
        const step = stateRef.current.steps.get(value);
        if (step) {
          // Only changes to the pending transition's endpoints interrupt it.
          // Keep the revision bump so disable → enable cannot revive a request.
          const pending = pendingNavigationRef.current;
          if (disabled !== step.disabled && pending &&
            (value === pending.source || value === pending.target)) {
            navigationRef.current += 1;
          }
          const updatedStep: StepState = { ...step, completed, disabled };
          const nextSteps = new Map(stateRef.current.steps);
          nextSteps.set(value, updatedStep);
          stateRef.current.steps = nextSteps;

          if (completed !== step.completed) {
            propsRef.current.onValueComplete?.(value, completed);
          }

          store.notify();
        }
      },
      notify: () => {
        for (const cb of listenersRef.current) {
          cb();
        }
      },
    };
  }, [listenersRef, stateRef, propsRef]);

  useIsomorphicLayoutEffect(() => {
    if (value !== undefined && stateRef.current.value !== value) {
      navigationRef.current += 1;
      stateRef.current.value = value;
      store.notify();
    }
  }, [value, stateRef, store]);

  useIsomorphicLayoutEffect(() => {
    isMountedRef.current = true;
    navigationRef.current += 1;
    return () => {
      isMountedRef.current = false;
      navigationRef.current += 1;
    };
  }, [disabled]);

  const contextDir = useDirection();
  const dir = dirProp ?? contextDir;

  const instanceId = React.useId();
  const rootId = id ?? instanceId;

  const contextValue = React.useMemo<StepperContextValue>(
    () => ({
      isMountedRef,
      validatedFocusRef,
      rootId,
      dir,
      orientation,
      activationMode,
      disabled,
      nonInteractive,
      loop,
    }),
    [rootId, dir, orientation, activationMode, disabled, nonInteractive, loop],
  );

  const element = useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        id: rootId,
        dir,
        className: cn(
          "flex gap-6",
          orientation === "horizontal" ? "w-full flex-col" : "flex-row",
          className,
        ),
      },
      rootProps,
    ),
    render,
    state: {
      slot: "stepper",
      disabled: disabled ? "" : undefined,
      orientation,
    },
  });

  return (
    <StoreContext.Provider value={store}>
      <StepperContext.Provider value={contextValue}>
        {element}
      </StepperContext.Provider>
    </StoreContext.Provider>
  );
}

interface FocusContextValue {
  tabStopId: string | null;
  onItemFocus: (tabStopId: string) => void;
  onItemShiftTab: () => void;
  onFocusableItemAdd: () => void;
  onFocusableItemRemove: () => void;
  onItemRegister: (item: ItemData) => void;
  onItemUnregister: (id: string) => void;
  getItems: () => ItemData[];
}

const FocusContext = React.createContext<FocusContextValue | null>(null);

function useFocusContext(consumerName: string) {
  const context = React.useContext(FocusContext);
  if (!context) {
    throw new Error(
      `\`${consumerName}\` must be used within \`FocusProvider\``,
    );
  }
  return context;
}

function StepperList(props: DivProps) {
  const {
    render,
    onBlur: onBlurProp,
    onFocus: onFocusProp,
    onMouseDown: onMouseDownProp,
    className,
    children,
    ref,
    ...listProps
  } = props;

  const context = useStepperContext(LIST_NAME);
  const orientation = context.orientation;
  const currentValue = useStore((state) => state.value);

  const propsRef = useAsRef({
    onBlur: onBlurProp,
    onFocus: onFocusProp,
    onMouseDown: onMouseDownProp,
  });

  const [tabStopId, setTabStopId] = React.useState<string | null>(null);
  const [isTabbingBackOut, setIsTabbingBackOut] = React.useState(false);
  const [focusableItemCount, setFocusableItemCount] = React.useState(0);
  const isClickFocusRef = React.useRef(false);
  const itemsRef = React.useRef<Map<string, ItemData>>(new Map());
  const listRef = React.useRef<ListElement>(null);
  const composedRef = useComposedRefs(ref, listRef);

  const onItemFocus = React.useCallback((tabStopId: string) => {
    setTabStopId(tabStopId);
  }, []);

  const onItemShiftTab = React.useCallback(() => {
    setIsTabbingBackOut(true);
  }, []);

  const onFocusableItemAdd = React.useCallback(() => {
    setFocusableItemCount((prevCount) => prevCount + 1);
  }, []);

  const onFocusableItemRemove = React.useCallback(() => {
    setFocusableItemCount((prevCount) => prevCount - 1);
  }, []);

  const onItemRegister = React.useCallback((item: ItemData) => {
    itemsRef.current.set(item.id, item);
  }, []);

  const onItemUnregister = React.useCallback((id: string) => {
    itemsRef.current.delete(id);
  }, []);

  const getItems = React.useCallback(() => {
    return Array.from(itemsRef.current.values())
      .filter((item) => item.ref.current)
      .sort((a, b) => {
        const elementA = a.ref.current;
        const elementB = b.ref.current;
        if (!elementA || !elementB) return 0;
        const position = elementA.compareDocumentPosition(elementB);
        if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
          return -1;
        }
        if (position & Node.DOCUMENT_POSITION_PRECEDING) {
          return 1;
        }
        return 0;
      });
  }, []);

  const onBlur = React.useCallback(
    (event: React.FocusEvent<ListElement>) => {
      propsRef.current.onBlur?.(event);
      if (event.defaultPrevented) return;

      setIsTabbingBackOut(false);
    },
    [propsRef],
  );

  const onFocus = React.useCallback(
    (event: React.FocusEvent<ListElement>) => {
      propsRef.current.onFocus?.(event);
      if (event.defaultPrevented) return;

      const isKeyboardFocus = !isClickFocusRef.current;
      if (
        event.target === event.currentTarget &&
        isKeyboardFocus &&
        !isTabbingBackOut
      ) {
        const entryFocusEvent = new CustomEvent(ENTRY_FOCUS, EVENT_OPTIONS);
        event.currentTarget.dispatchEvent(entryFocusEvent);

        if (!entryFocusEvent.defaultPrevented) {
          const items = Array.from(itemsRef.current.values()).filter(
            (item) => !item.disabled,
          );
          const selectedItem = currentValue
            ? items.find((item) => item.value === currentValue)
            : undefined;
          const activeItem = items.find((item) => item.active);
          const currentItem = items.find((item) => item.id === tabStopId);

          const candidateItems = [
            selectedItem,
            activeItem,
            currentItem,
            ...items,
          ].filter(Boolean) as ItemData[];
          const candidateRefs = candidateItems.map((item) => item.ref);
          focusFirst(candidateRefs, false);
        }
      }
      isClickFocusRef.current = false;
    },
    [propsRef, isTabbingBackOut, currentValue, tabStopId],
  );

  const onMouseDown = React.useCallback(
    (event: React.MouseEvent<ListElement>) => {
      propsRef.current.onMouseDown?.(event);

      if (event.defaultPrevented) return;

      isClickFocusRef.current = true;
    },
    [propsRef],
  );

  const focusContextValue = React.useMemo<FocusContextValue>(
    () => ({
      tabStopId,
      onItemFocus,
      onItemShiftTab,
      onFocusableItemAdd,
      onFocusableItemRemove,
      onItemRegister,
      onItemUnregister,
      getItems,
    }),
    [
      tabStopId,
      onItemFocus,
      onItemShiftTab,
      onFocusableItemAdd,
      onFocusableItemRemove,
      onItemRegister,
      onItemUnregister,
      getItems,
    ],
  );

  const element = useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        role: "tablist",
        "aria-orientation": orientation,
        dir: context.dir,
        tabIndex: isTabbingBackOut || focusableItemCount === 0 ? -1 : 0,
        ref: composedRef,
        className: cn(
          "flex outline-none",
          orientation === "horizontal"
            ? "flex-row items-center justify-start gap-2"
            : "flex-col items-start",
          className,
        ),
        onBlur,
        onFocus,
        onMouseDown,
        children,
      },
      listProps,
    ),
    render,
    state: {
      slot: "stepper-list",
      orientation,
    },
  });

  return (
    <FocusContext.Provider value={focusContextValue}>
      {element}
    </FocusContext.Provider>
  );
}

interface StepperItemContextValue {
  value: string;
  stepState: StepState | undefined;
}

const StepperItemContext = React.createContext<StepperItemContextValue | null>(
  null,
);

function useStepperItemContext(consumerName: string) {
  const context = React.useContext(StepperItemContext);
  if (!context) {
    throw new Error(`\`${consumerName}\` must be used within \`${ITEM_NAME}\``);
  }
  return context;
}

interface StepperItemProps extends DivProps {
  value: string;
  completed?: boolean;
  disabled?: boolean;
}

function StepperItem(props: StepperItemProps) {
  const {
    value: itemValue,
    completed = false,
    disabled = false,
    render,
    className,
    children,
    ref,
    ...itemProps
  } = props;

  const context = useStepperContext(ITEM_NAME);
  const store = useStoreContext(ITEM_NAME);
  const orientation = context.orientation;
  const value = useStore((state) => state.value);

  useIsomorphicLayoutEffect(() => {
    store.addStep(itemValue, completed, disabled);

    return () => {
      store.removeStep(itemValue);
    };
  }, [itemValue, store]);

  useIsomorphicLayoutEffect(() => {
    store.setStep(itemValue, completed, disabled);
  }, [itemValue, completed, disabled]);

  const stepState = useStore((state) => state.steps.get(itemValue));
  const steps = useStore((state) => state.steps);
  const dataState = getDataState(value, itemValue, stepState, steps);

  const itemContextValue = React.useMemo<StepperItemContextValue>(
    () => ({
      value: itemValue,
      stepState,
    }),
    [itemValue, stepState],
  );

  const element = useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        dir: context.dir,
        ref,
        className: cn(
          "relative flex items-center transition-colors duration-fast data-[state=active]:bg-hover",
          orientation === "horizontal"
            ? "flex-row"
            : "w-full flex-col items-start",
          "rounded-lg",
          className,
        ),
        children,
      },
      itemProps,
    ),
    render,
    state: {
      slot: "stepper-item",
      disabled: stepState?.disabled ? "" : undefined,
      orientation,
      state: dataState,
    },
  });

  return (
    <StepperItemContext.Provider value={itemContextValue}>
      {element}
    </StepperItemContext.Provider>
  );
}

function StepperTrigger(props: ButtonProps) {
  const {
    render,
    onClick: onClickProp,
    onFocus: onFocusProp,
    onKeyDown: onKeyDownProp,
    onMouseDown: onMouseDownProp,
    disabled,
    className,
    ref,
    ...triggerProps
  } = props;

  const context = useStepperContext(TRIGGER_NAME);
  const itemContext = useStepperItemContext(TRIGGER_NAME);
  const itemValue = itemContext.value;

  const store = useStoreContext(TRIGGER_NAME);
  const focusContext = useFocusContext(TRIGGER_NAME);
  const value = useStore((state) => state.value);
  const steps = useStore((state) => state.steps);
  const stepState = useStore((state) => state.steps.get(itemValue));

  const propsRef = useAsRef({
    onClick: onClickProp,
    onFocus: onFocusProp,
    onKeyDown: onKeyDownProp,
    onMouseDown: onMouseDownProp,
  });

  const activationMode = context.activationMode;
  const orientation = context.orientation;
  const loop = context.loop;

  const stepIndex = Array.from(steps.keys()).indexOf(itemValue);

  const stepPosition = stepIndex + 1;
  const stepCount = steps.size;

  const triggerId = getId(context.rootId, "trigger", itemValue);
  const contentId = getId(context.rootId, "content", itemValue);
  const titleId = getId(context.rootId, "title", itemValue);
  const descriptionId = getId(context.rootId, "description", itemValue);

  const isDisabled = disabled || stepState?.disabled || context.disabled;
  const isActive = value === itemValue;
  const isTabStop = focusContext.tabStopId === triggerId;
  const dataState = getDataState(value, itemValue, stepState, steps);

  const triggerRef = React.useRef<TriggerElement>(null);
  const composedRef = useComposedRefs(ref, triggerRef);
  const isArrowKeyPressedRef = React.useRef(false);
  const isMouseClickRef = React.useRef(false);
  const focusRequestRef = React.useRef(0);
  const focusStateRef = useAsRef({
    itemValue,
    isDisabled,
    activationMode,
    nonInteractive: context.nonInteractive,
  });

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (ARROW_KEYS.includes(event.key)) {
        isArrowKeyPressedRef.current = true;
      }
    }
    function onKeyUp() {
      isArrowKeyPressedRef.current = false;
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useIsomorphicLayoutEffect(() => {
    focusContext.onItemRegister({
      id: triggerId,
      ref: triggerRef,
      value: itemValue,
      active: isTabStop,
      disabled: !!isDisabled,
    });

    if (!isDisabled) {
      focusContext.onFocusableItemAdd();
    }

    return () => {
      focusContext.onItemUnregister(triggerId);
      if (!isDisabled) {
        focusContext.onFocusableItemRemove();
      }
    };
  }, [focusContext, triggerId, itemValue, isTabStop, isDisabled]);

  const onClick = React.useCallback(
    async (event: React.MouseEvent<TriggerElement>) => {
      propsRef.current.onClick?.(event);
      if (event.defaultPrevented) return;

      if (!isDisabled && !context.nonInteractive) {
        const currentStepIndex = Array.from(steps.keys()).indexOf(value ?? "");
        const targetStepIndex = Array.from(steps.keys()).indexOf(itemValue);
        const direction = targetStepIndex > currentStepIndex ? "next" : "prev";

        await store.setStateWithValidation(itemValue, direction);
      }
    },
    [
      isDisabled,
      context.nonInteractive,
      store,
      itemValue,
      value,
      steps,
      propsRef,
    ],
  );

  const onFocus = React.useCallback(
    (event: React.FocusEvent<TriggerElement>) => {
      const request = ++focusRequestRef.current;
      const navigationIntent = store.getNavigationIntent();
      propsRef.current.onFocus?.(event);
      if (event.defaultPrevented) return;

      focusContext.onItemFocus(triggerId);

      const isKeyboardFocus = !isMouseClickRef.current;
      const alreadyValidated = context.validatedFocusRef.current === itemValue;

      if (
        !alreadyValidated &&
        store.getState().value !== itemValue &&
        !isDisabled &&
        activationMode !== "manual" &&
        !context.nonInteractive &&
        isKeyboardFocus
      ) {
        const activate = () => {
          const current = focusStateRef.current;
          const state = store.getState();
          if (
            request !== focusRequestRef.current ||
            current.itemValue !== itemValue ||
            current.isDisabled ||
            current.activationMode === "manual" ||
            current.nonInteractive ||
            state.value === itemValue
          ) return;

          const stepValues = Array.from(state.steps.keys());
          const currentStepIndex = stepValues.indexOf(state.value);
          const targetStepIndex = stepValues.indexOf(itemValue);
          const direction = targetStepIndex > currentStepIndex ? "next" : "prev";

          void store.setStateWithValidation(itemValue, direction);
        };

        if (!context.isMountedRef.current || !store.getState().steps.has(itemValue)) {
          // Initial focus can precede item registration or root layout effects.
          // Wait for that commit without replaying focus over a newer navigation.
          const target = event.currentTarget;
          queueMicrotask(() => {
            if (
              context.isMountedRef.current &&
              store.getNavigationIntent() === navigationIntent &&
              triggerRef.current === target &&
              target.ownerDocument.activeElement === target
            ) activate();
          });
        } else {
          activate();
        }
      }

      isMouseClickRef.current = false;
    },
    [
      focusContext,
      triggerId,
      activationMode,
      isDisabled,
      context.nonInteractive,
      context.isMountedRef,
      context.validatedFocusRef,
      store,
      itemValue,
      propsRef,
      focusStateRef,
    ],
  );

  const onKeyDown = React.useCallback(
    async (event: React.KeyboardEvent<TriggerElement>) => {
      propsRef.current.onKeyDown?.(event);
      if (event.defaultPrevented) return;

      if (event.key === "Enter" && context.nonInteractive) {
        event.preventDefault();
        return;
      }

      if (
        (event.key === "Enter" || event.key === " ") &&
        activationMode === "manual" &&
        !context.nonInteractive
      ) {
        event.preventDefault();
        if (!isDisabled && triggerRef.current) {
          triggerRef.current.click();
        }
        return;
      }

      if (event.key === "Tab" && event.shiftKey) {
        focusContext.onItemShiftTab();
        return;
      }

      if (event.target !== event.currentTarget) return;

      const focusIntent = getFocusIntent(event, context.dir, orientation);

      if (focusIntent !== undefined) {
        if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey)
          return;
        event.preventDefault();

        const items = focusContext.getItems().filter((item) => !item.disabled);
        let candidateRefs = items.map((item) => item.ref);

        if (focusIntent === "last") {
          candidateRefs.reverse();
        } else if (focusIntent === "prev" || focusIntent === "next") {
          if (focusIntent === "prev") candidateRefs.reverse();
          const currentIndex = candidateRefs.findIndex(
            (ref) => ref.current === event.currentTarget,
          );
          candidateRefs = loop
            ? wrapArray(candidateRefs, currentIndex + 1)
            : candidateRefs.slice(currentIndex + 1);
        }

        if (activationMode === "automatic" && !context.nonInteractive && store.hasValidation() && candidateRefs.length > 0) {
          const nextRef = candidateRefs[0];
          const nextElement = nextRef?.current;
          const nextItem = items.find(
            (item) => item.ref.current === nextElement,
          );

          if (nextItem && nextItem.value !== itemValue) {
            const currentStepIndex = Array.from(steps.keys()).indexOf(
              value || "",
            );
            const targetStepIndex = Array.from(steps.keys()).indexOf(
              nextItem.value,
            );
            const direction: NavigationDirection =
              targetStepIndex > currentStepIndex ? "next" : "prev";

            if (direction === "next") {
              const isValid = await store.setStateWithValidation(
                nextItem.value,
                direction,
              );
              if (!isValid) return;
            } else {
              store.setState("value", nextItem.value);
            }

            // Controlled consumers may not have committed their value yet.
            // Do not validate the same accepted keyboard transition on focus again.
            context.validatedFocusRef.current = nextItem.value;
            try {
              nextElement?.focus();
            } finally {
              context.validatedFocusRef.current = null;
            }
            return;
          }
        }

        queueMicrotask(() => focusFirst(candidateRefs));
      }
    },
    [
      focusContext,
      context.nonInteractive,
      context.dir,
      context.validatedFocusRef,
      activationMode,
      orientation,
      loop,
      isDisabled,
      store,
      propsRef,
      itemValue,
      value,
      steps,
    ],
  );

  const onMouseDown = React.useCallback(
    (event: React.MouseEvent<TriggerElement>) => {
      propsRef.current.onMouseDown?.(event);
      if (event.defaultPrevented) return;

      isMouseClickRef.current = true;

      if (isDisabled) {
        event.preventDefault();
      } else {
        focusContext.onItemFocus(triggerId);
      }
    },
    [focusContext, triggerId, isDisabled, propsRef],
  );

  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        id: triggerId,
        role: "tab",
        type: "button",
        "aria-controls": contentId,
        "aria-current": isActive ? "step" : undefined,
        "aria-describedby": `${titleId} ${descriptionId}`,
        "aria-posinset": stepPosition,
        "aria-selected": isActive,
        "aria-setsize": stepCount,
        disabled: isDisabled,
        tabIndex: isTabStop ? 0 : -1,
        ref: composedRef,
        className: cn(
          "inline-flex items-center justify-center gap-3 px-2 py-1.5 pl-1.5 text-left outline-none transition-[color,box-shadow] duration-fast [&:has([data-slot=description])]:pl-2",
          "focus-visible:ring-1 focus-visible:ring-focus-ring",
          "disabled:pointer-events-none disabled:opacity-50 aria-invalid:ring-1 aria-invalid:ring-danger-border/40 aria-invalid:focus-visible:outline-1 aria-invalid:focus-visible:outline-focus-ring aria-invalid:focus-visible:outline-offset-2",
          "[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
          "rounded-2xl",
          className,
        ),
        onClick,
        onFocus,
        onKeyDown,
        onMouseDown,
      },
      triggerProps,
    ),
    render,
    state: {
      slot: "stepper-trigger",
      disabled: isDisabled ? "" : undefined,
      state: dataState,
    },
  });
}

interface StepperIndicatorProps
  extends Omit<DivProps, "children">,
    Omit<useRender.ComponentProps<"div">, "children"> {
  children?: React.ReactNode | ((dataState: DataState) => React.ReactNode);
}

function StepperIndicator(props: StepperIndicatorProps) {
  const { className, children, render, ref, style, ...indicatorProps } = props;

  const context = useStepperContext(INDICATOR_NAME);
  const Check = useIcon("check");
  const itemContext = useStepperItemContext(INDICATOR_NAME);

  const value = useStore((state) => state.value);
  const itemValue = itemContext.value;
  const stepState = useStore((state) => state.steps.get(itemValue));
  const steps = useStore((state) => state.steps);

  const stepPosition = Array.from(steps.keys()).indexOf(itemValue) + 1;

  const dataState = getDataState(value, itemValue, stepState, steps);

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        dir: context.dir,
        ref,
        style: { ...style },
        className: cn(
          "flex size-6 shrink-0 items-center justify-center bg-muted text-label text-fg-default transition-colors duration-fast",
          "data-[state=active]:bg-brand data-[state=completed]:bg-brand",
          "data-[state=active]:text-fg-on-brand data-[state=completed]:text-fg-on-brand",
          "rounded-lg",
          "font-medium",
          className
        ),
        children:
          typeof children === "function" ? (
            children(dataState)
          ) : children ? (
            children
          ) : dataState === "completed" ? (
            <Check className="size-4" />
          ) : (
            stepPosition
          ),
      },
      indicatorProps,
    ),
    render,
    state: {
      slot: "stepper-indicator",
      state: dataState,
    },
  });
}

interface StepperTitleProps
  extends React.ComponentProps<"span">,
    useRender.ComponentProps<"span"> {}

function StepperTitle(props: StepperTitleProps) {
  const { className, render, ref, style, ...titleProps } = props;

  const context = useStepperContext(TITLE_NAME);
  const itemContext = useStepperItemContext(TITLE_NAME);

  const titleId = getId(context.rootId, "title", itemContext.value);

  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        id: titleId,
        dir: context.dir,
        ref,
        style,
        className: cn("text-body font-medium", className),
      },
      titleProps,
    ),
    render,
    state: {
      slot: "title",
    },
  });
}

interface StepperDescriptionProps
  extends React.ComponentProps<"span">,
    useRender.ComponentProps<"span"> {}

function StepperDescription(props: StepperDescriptionProps) {
  const { className, render, ref, ...descriptionProps } = props;

  const context = useStepperContext(DESCRIPTION_NAME);
  const itemContext = useStepperItemContext(DESCRIPTION_NAME);

  const descriptionId = getId(context.rootId, "description", itemContext.value);

  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        id: descriptionId,
        dir: context.dir,
        ref,
        className: cn("text-label text-fg-muted", className),
      },
      descriptionProps,
    ),
    render,
    state: {
      slot: "description",
    },
  });
}

interface StepperContentProps extends DivProps {
  value: string;
  forceMount?: boolean;
}

function StepperContent(props: StepperContentProps) {
  const {
    value: valueProp,
    render,
    forceMount = false,
    ref,
    className,
    ...contentProps
  } = props;

  const context = useStepperContext(CONTENT_NAME);
  const value = useStore((state) => state.value);

  const contentId = getId(context.rootId, "content", valueProp);
  const triggerId = getId(context.rootId, "trigger", valueProp);

  const element = useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        id: contentId,
        role: "tabpanel",
        "aria-labelledby": triggerId,
        dir: context.dir,
        ref,
        className: cn("flex-1 outline-none", className),
      },
      contentProps,
    ),
    render,
    state: {
      slot: "stepper-content",
    },
  });

  if (valueProp !== value && !forceMount) return null;

  return element;
}

function StepperPrev(props: ButtonProps) {
  const { render, onClick: onClickProp, disabled, ...prevProps } = props;

  const context = useStepperContext(PREV_NAME);
  const store = useStoreContext(PREV_NAME);
  const value = useStore((state) => state.value);
  const steps = useStore((state) => state.steps);

  const propsRef = useAsRef({
    onClick: onClickProp,
  });

  const stepKeys = Array.from(steps.keys());
  const currentIndex = value ? stepKeys.indexOf(value) : -1;
  const prevStepValue = stepKeys.slice(0, Math.max(currentIndex, 0)).reverse().find((key) => !steps.get(key)?.disabled);
  const isDisabled = disabled || context.disabled || !prevStepValue;

  const onClick = React.useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      propsRef.current.onClick?.(event);
      if (event.defaultPrevented || isDisabled) return;

      if (prevStepValue) {
        store.setState("value", prevStepValue);
      }
    },
    [propsRef, isDisabled, prevStepValue, store],
  );

  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        type: "button",
        disabled: isDisabled,
        onClick,
      },
      prevProps,
    ),
    render,
    state: {
      slot: "stepper-prev",
    },
  });
}

function StepperNext(props: ButtonProps) {
  const { render, onClick: onClickProp, disabled, ...nextProps } = props;

  const context = useStepperContext(NEXT_NAME);
  const store = useStoreContext(NEXT_NAME);
  const value = useStore((state) => state.value);
  const steps = useStore((state) => state.steps);

  const propsRef = useAsRef({
    onClick: onClickProp,
  });

  const stepKeys = Array.from(steps.keys());
  const currentIndex = value ? stepKeys.indexOf(value) : -1;
  const nextStepValue = stepKeys.slice(currentIndex + 1).find((key) => !steps.get(key)?.disabled);
  const isDisabled = disabled || context.disabled || !nextStepValue;

  const onClick = React.useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      propsRef.current.onClick?.(event);
      if (event.defaultPrevented || isDisabled) return;

      if (nextStepValue) {
        await store.setStateWithValidation(nextStepValue, "next");
      }
    },
    [propsRef, isDisabled, nextStepValue, store],
  );

  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        type: "button",
        disabled: isDisabled,
        onClick,
      },
      nextProps,
    ),
    render,
    state: {
      slot: "stepper-next",
    },
  });
}

export {
  Stepper,
  StepperContent,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperList,
  StepperNext,
  StepperPrev,
  type StepperProps,
  StepperTitle,
  StepperTrigger,
  useStore as useStepper,
};

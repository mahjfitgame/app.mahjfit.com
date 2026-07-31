# FULL SET OF SIGNALS
signal()
computed()
linkedSignal()
debounced()

isSignal()
isWritableSignal()

resource() // Async value
resourceFromSnapshots()
rxResource()

httpResource() // Reactive HTTP request

// component signal
input() // Component signal, Read-only value received from parent
model() // Component signal, Writable two-way binding with parent
output() // Component signal, Read-only value sent to parent
inputBinding()
twoWayBinding()
outputBinding()

viewChild() // Component/template queries
contentChild()

// form signals
form()
schema()
apply()
applyEach()
applyWhen()
applyWhenValue()
isFieldTree()
hidden()
readonly()
debounce()
metadata()
createMetadataKey()
createManagedMetadataKey()
createLimitSelectionKey()
provideSignalFormsConfig()
provideExperimentalWebMcpForms()

required()
email()
min()
max()
minDate()
maxDate()
minLength()
maxLength()
pattern()
validate()
validateTree()
validateAsync()
validateHttp()
validateStandardSchema()

requiredError()
emailError()
minError()
maxError()
minDateError()
maxDateError()
minLengthError()
maxLengthError()
patternError()
standardSchemaError()

transformedValue()
submit()

// listeners
effect(() => {}) // reacts to signal changes and performs side effects.
afterRenderEffect(() => {}) // runs after the view has been rendered
untracked(() => {}) // reads a signal without registering it as a dependency.
afterNextRender()
afterEveryRender()

// Router signals
router.currentNavigation
router.lastSuccessfulNavigation
isActive()


// RxJS and signal interoperability
toSignal() // Observable<T> → Signal<T>
toObservable() // Signal<T> → Observable<T>
rxResource() // Observable-backed resource
outputFromObservable() // Observable → Angular output
outputToObservable() // Angular output → Observable
takeUntilDestroyed() // Automatically end subscriptions
pendingUntilEvent() // Track application stability until an Observable emits

---

Angular has far more than `signal()`, `computed()`, and `linkedSignal()`. As of **Angular 22.1**, this is the complete practical public signal ecosystem. I am excluding internal `ɵ...` APIs and purely supporting TypeScript aliases, because cataloguing plumbing is not the same as cataloguing features. ([Angular][1])

## 1. Core signal state

| API              | Returns             | Writable | Purpose                                            |
| ---------------- | ------------------- | -------: | -------------------------------------------------- |
| `signal()`       | `WritableSignal<T>` |      Yes | Independent application state                      |
| `computed()`     | `Signal<T>`         |       No | Read-only derived state                            |
| `linkedSignal()` | `WritableSignal<T>` |      Yes | Derived state that can also be manually changed    |
| `debounced()`    | `Resource<T>`       |       No | Debounced version of a signal source, experimental |

```ts
const count = signal(0);

const doubled = computed(() => count() * 2);

const editableDoubled = linkedSignal(() => count() * 2);

const delayedSearch = debounced(
    () => searchText(),
    300,
);
```

`linkedSignal()` also supports:

```ts
const selectedItem = linkedSignal({
    source: () => items(),
    computation: (items, previous) => {
        return items.find(
            item => item.id === previous?.value.id,
        ) ?? items[0];
    },
    equal: Object.is,
    debugName: 'selectedItem',
    set: (value, rawSet) => rawSet(value),
});
```

`debounced()` is experimental in Angular 22 and returns a `Resource<T>`, not a normal `Signal<T>`. ([Angular][2])

---

## 2. Signal types and operations

### Types

```ts
Signal<T>
WritableSignal<T>
ValueEqualityFn<T>
```

### `WritableSignal` operations

```ts
value();                    // Read
value.set(newValue);        // Replace
value.update(current => current + 1);
value.asReadonly();         // WritableSignal<T> → Signal<T>
```

### Creation options

```ts
const state = signal(initialValue, {
    equal: Object.is,
    debugName: 'state',
});

const result = computed(() => state(), {
    equal: Object.is,
    debugName: 'result',
});
```

### Signal inspection

```ts
isSignal(value);
isWritableSignal(value);
```

### Read without dependency tracking

```ts
const result = untracked(() => someSignal());
```

`untracked()` reads signals without making the surrounding `computed()` or `effect()` depend on them. ([Angular][3])

---

## 3. Reactive execution and rendering

| API                     | Purpose                                        |
| ----------------------- | ---------------------------------------------- |
| `effect()`              | Run side-effect code when dependencies change  |
| `afterRenderEffect()`   | Reactive effect after Angular renders          |
| `EffectRef`             | Manually destroy an effect                     |
| Effect cleanup callback | Clean timers, subscriptions, listeners         |
| `untracked()`           | Exclude a signal read from dependency tracking |

```ts
const ref = effect((onCleanup) => {
    const id = setInterval(() => {
        console.log(count());
    }, 1000);

    onCleanup(() => clearInterval(id));
});

ref.destroy();
```

```ts
afterRenderEffect(() => {
    const element = elementRef();
    // Read or update DOM after rendering
});
```

These are related render APIs, but they are **not signal-tracking effects**:

```ts
afterNextRender();
afterEveryRender();
```

Use `computed()` or `linkedSignal()` for state derivation. Do not use `effect()` merely to copy one signal into another. That creates synchronisation code, which is frontend terminology for “future debugging appointment.”

---

## 4. Component signal APIs

### Signal inputs

```ts
name = input<string>();
name = input.required<string>();
```

Options include:

```ts
age = input(0, {
    alias: 'userAge',
    transform: numberAttribute,
    debugName: 'age',
});
```

Types:

```ts
InputSignal<T>
InputSignalWithTransform<T, TransformT>
```

### Model signals

`model()` creates writable two-way component state:

```ts
value = model<string>();
value = model.required<string>();
```

Parent:

```html
<app-editor [(value)]="name" />
```

Types:

```ts
ModelSignal<T>
```

A model input automatically corresponds to an output such as `valueChange`.

### Signal queries

```ts
child = viewChild(ChildComponent);
child = viewChild.required(ChildComponent);

children = viewChildren(ChildComponent);

projectedChild = contentChild(ChildComponent);
projectedChild = contentChild.required(ChildComponent);

projectedChildren = contentChildren(ChildComponent);
```

The result types are:

```ts
Signal<T | undefined>
Signal<T>
Signal<readonly T[]>
```

Signal queries replace many uses of decorator-based `@ViewChild`, `@ViewChildren`, `@ContentChild`, and `@ContentChildren`. ([Angular][4])

### Programmatic signal bindings

When creating components dynamically:

```ts
inputBinding('disabled', disabledSignal);

twoWayBinding('value', writableValueSignal);

outputBinding('changed', value => {
    console.log(value);
});
```

`inputBinding()` can use a signal or getter. `twoWayBinding()` specifically receives a `WritableSignal`. ([Angular][5])

### `output()` clarification

```ts
changed = output<string>();
```

`output()` belongs to Angular’s modern initializer APIs, but it is **not a signal**. It is an event emitter represented by `OutputEmitterRef<T>`.

---

## 5. Asynchronous signal resources

### `resource()`

Use `resource()` for Promise-based reactive loading:

```ts
user = resource({
    params: () => ({
        id: userId(),
    }),
    loader: ({ params, abortSignal }) => {
        return loadUser(params.id, abortSignal);
    },
});
```

Angular 22 supports standard loaders and streaming resource loaders. `resource()` is intended mainly for async reads, not POST, PUT, or DELETE mutation workflows. ([Angular][6])

### Resource state signals

A resource exposes:

```ts
resource.value
resource.status
resource.error
resource.isLoading
```

And operations such as:

```ts
resource.reload();
resource.set(value);
resource.update(current => updated);
resource.hasValue();
resource.asReadonly();
resource.destroy();
```

Important resource types include:

```ts
Resource<T>
WritableResource<T>
ResourceRef<T>
ResourceSnapshot<T>
ResourceStatus
ResourceStreamItem<T>
ResourceLoader<T>
ResourceStreamingLoader<T>
```

### `resourceFromSnapshots()`

```ts
const composed = resourceFromSnapshots(
    () => originalResource.snapshot(),
);
```

This creates a resource driven by `ResourceSnapshot` values. It is currently experimental. ([Angular][7])

### `rxResource()`

Observable-based resource:

```ts
user = rxResource({
    params: () => userId(),
    stream: ({ params }) => {
        return this.userService.getUser(params);
    },
});
```

### `httpResource()`

Reactive `HttpClient` request:

```ts
user = httpResource<User>(
    () => `/api/users/${userId()}`,
);
```

Available response constructors:

```ts
httpResource()             // JSON
httpResource.text()
httpResource.blob()
httpResource.arrayBuffer()
```

It supports interceptors, request options, default values, parsing and reactive URL/request changes. ([Angular][8])

---

## 6. RxJS and signal interoperability

From `@angular/core/rxjs-interop`:

| API                      | Conversion or purpose                                 |
| ------------------------ | ----------------------------------------------------- |
| `toSignal()`             | `Observable<T>` → `Signal<T>`                         |
| `toObservable()`         | `Signal<T>` → `Observable<T>`                         |
| `rxResource()`           | Observable-backed resource                            |
| `outputFromObservable()` | Observable → Angular output                           |
| `outputToObservable()`   | Angular output → Observable                           |
| `takeUntilDestroyed()`   | Automatically end subscriptions                       |
| `pendingUntilEvent()`    | Track application stability until an Observable emits |

```ts
readonly user = toSignal(
    this.userService.user$,
    {
        initialValue: null,
    },
);

readonly user$ = toObservable(this.user);
```

`outputFromObservable()`, `outputToObservable()`, `takeUntilDestroyed()`, and `pendingUntilEvent()` are signal-adjacent APIs, not signal state creators themselves. ([Angular][9])

---

# 7. Signal Forms

Signal Forms are stable in Angular 22 and imported from:

```ts
import {
    form,
    FormField,
    required,
} from '@angular/forms/signals';
```

A writable model signal remains the source of truth:

```ts
readonly model = signal({
    name: '',
    email: '',
});

readonly userForm = form(this.model, (path) => {
    required(path.name);
    required(path.email);
    email(path.email);
});
```

```html
<input [formField]="userForm.name" />
<input [formField]="userForm.email" />
```

Updating the form writes directly into `model()`. ([Angular][10])

## Form structure and schema APIs

```ts
form()
schema()

apply()
applyEach()
applyWhen()
applyWhenValue()
```

Purpose:

| API                | Purpose                                             |
| ------------------ | --------------------------------------------------- |
| `form()`           | Create a `FieldTree` around a writable model signal |
| `schema()`         | Create reusable form logic                          |
| `apply()`          | Apply another schema                                |
| `applyEach()`      | Apply schema to every array/object item             |
| `applyWhen()`      | Apply schema conditionally                          |
| `applyWhenValue()` | Apply schema based on a field value                 |

([Angular][11])

## Form tree and context APIs

```ts
FieldTree<T>
ReadonlyFieldTree<T>

Field<T>
FieldState<T>
ReadonlyFieldState<T>

FieldContext<T>
RootFieldContext<T>
ChildFieldContext<T>
ItemFieldContext<T>

SchemaPath<T>
SchemaPathTree<T>

isFieldTree()
```

Contexts support cross-field access through:

```ts
context.value
context.state
context.fieldTree

context.valueOf(path)
context.stateOf(path)
context.fieldTreeOf(path)
context.pathKeys
```

([Angular][12])

## Complete `FieldState` signal list

Writable signals:

```ts
field.value
field.controlValue
```

Read-only signals:

```ts
field.disabled
field.max
field.maxLength
field.min
field.minLength
field.name
field.pattern
field.readonly
field.required
field.touched
field.dirty
field.hidden
field.disabledReasons
field.errors
field.errorSummary
field.valid
field.invalid
field.pending
field.submitting
field.keyInParent
field.formFieldBindings
```

Methods:

```ts
field.markAsDirty();
field.markAsTouched();
field.getError('required');
field.reset();
field.reloadValidation();
field.metadata(key);
field.hasMetadata(key);
field.focusBoundControl();
```

`valid()` and `invalid()` are not exact opposites while async validation is pending. Both can temporarily be `false`, because even booleans are no longer permitted simple lives. ([Angular][13])

## Form state logic

```ts
disabled()
hidden()
readonly()
debounce()
metadata()
```

Metadata APIs:

```ts
createMetadataKey()
createManagedMetadataKey()
createLimitSelectionKey()

MetadataKey
LimitSelectionKey
```

Configuration:

```ts
provideSignalFormsConfig()
```

Experimental integration:

```ts
provideExperimentalWebMcpForms()
```

## Built-in validators

```ts
required()
email()

min()
max()

minDate()
maxDate()

minLength()
maxLength()

pattern()
```

Custom and advanced validation:

```ts
validate()
validateTree()

validateAsync()
validateHttp()

validateStandardSchema()
```

`validateStandardSchema()` supports Standard Schema-compatible validators. Async validation only runs after synchronous validation passes. ([Angular][14])

## Typed validation error helpers

```ts
requiredError()
emailError()

minError()
maxError()

minDateError()
maxDateError()

minLengthError()
maxLengthError()

patternError()
standardSchemaError()
```

Associated metadata constants include:

```ts
REQUIRED

MIN
MAX
MIN_NUMBER
MAX_NUMBER

MIN_DATE
MAX_DATE

MIN_LENGTH
MAX_LENGTH

PATTERN
IS_ASYNC_VALIDATION_RESOURCE
```

## Form binding and custom control APIs

```ts
FormField
FormRoot
FORM_FIELD

FormValueControl<T>
FormCheckboxControl
FormUiControl

FormFieldBinding
FormFieldBindingOptions
```

Use:

* `FormValueControl<T>` for normal value controls.
* `FormCheckboxControl` for checkbox-style controls.
* `FormUiControl` for UI state such as disabled, readonly, required and errors.

([Angular][15])

## Form transformation and submission

```ts
transformedValue()
TransformedValueSignal

submit()
FormSubmitOptions
```

State-management operations include:

```ts
field.reset();
field.reloadValidation();
field.markAsDirty();
field.markAsTouched();
```

Compatibility with older Reactive Forms controls is available through:

```ts
import {
    compatForm,
} from '@angular/forms/signals/compat';
```

The complete official Signal Forms API index also includes all related schema, validation, metadata, binding, parsing and error types. ([Angular][13])

---

## 8. Router signals

Angular Router now exposes signal-based state:

```ts
router.currentNavigation
// Signal<Navigation | null>

router.lastSuccessfulNavigation
// Signal<Navigation | null>
```

Computed active-route signal:

```ts
readonly userActive = isActive(
    '/user',
    inject(Router),
);
```

Router outlet data:

```html
<router-outlet
    [routerOutletData]="{ area: 'private' }"
/>
```

```ts
readonly outletData =
    inject(ROUTER_OUTLET_DATA) as Signal<{
        area: string;
    }>;
```

([Angular][16])

---

## Final selection guide

```ts
signal()                 // Independent writable state
computed()               // Read-only derived state
linkedSignal()           // Derived but writable state

input()                  // Parent → child
model()                  // Parent ↔ child
viewChild()              // Reactive view query
contentChild()           // Reactive projected-content query

effect()                 // Side effect
afterRenderEffect()      // Reactive DOM/render effect
untracked()              // Read without dependency tracking

resource()               // Promise-based asynchronous state
rxResource()             // Observable-based asynchronous state
httpResource()           // Reactive HTTP state
debounced()              // Debounced resource

toSignal()               // Observable → Signal
toObservable()           // Signal → Observable

form()                   // Signal-based form tree
schema()                 // Reusable form rules
```

For your CRUD architecture, the primary set will normally be:

```ts
signal()
computed()
linkedSignal()
resource() / httpResource()
form()
effect()
toSignal()
```
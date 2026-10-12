import { defineComponent, h } from 'vue'

/** Stand-in for a vue-chartjs component: happy-dom has no canvas, so only the props are checked. */
export function chartStub(name: string) {
  return defineComponent({
    name,
    props: {
      data: { type: Object, required: true },
      options: { type: Object, default: () => ({}) },
    },
    setup: (props) => () =>
      h('canvas', { 'data-chart': name, 'data-labels': JSON.stringify(props.data.labels) }),
  })
}

/**
 * Chart.js calls option callbacks with a live chart as `this` and a full tooltip item. Neither
 * exists without a canvas, so tests call the callback with just the field it reads.
 */
export function callWith<Item>(callback: unknown, item: Partial<Item>): unknown {
  return (callback as (this: unknown, item: Partial<Item>) => unknown).call(undefined, item)
}

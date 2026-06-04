Component({
  properties: {
    cells: {
      type: Array,
      value: []
    }
  },

  methods: {
    handleCellTap(event) {
      this.triggerEvent("select", {
        index: event.currentTarget.dataset.index
      });
    }
  }
});

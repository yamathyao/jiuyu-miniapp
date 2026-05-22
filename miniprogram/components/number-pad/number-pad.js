Component({
  data: {
    numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9]
  },
  methods: {
    handleTap(event) {
      this.triggerEvent("input", {
        value: event.currentTarget.dataset.value
      });
    }
  }
});


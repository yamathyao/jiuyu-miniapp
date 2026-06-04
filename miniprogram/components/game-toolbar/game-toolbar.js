Component({
  properties: {
    noteMode: {
      type: Boolean,
      value: false
    }
  },

  methods: {
    handleCommand(event) {
      this.triggerEvent("command", {
        command: event.currentTarget.dataset.command
      });
    }
  }
});

Component({
  methods: {
    handleCommand(event) {
      this.triggerEvent("command", {
        command: event.currentTarget.dataset.command
      });
    }
  }
});


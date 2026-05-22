Component({
  data: {
    cells: Array.from({ length: 81 }, function (_, index) {
      return {
        index: index,
        value: "",
        given: false
      };
    })
  }
});


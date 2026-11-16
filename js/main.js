(() => {

    const addLayout = document.getElementById("left-top-right-corner");
    const removeLayout = document.getElementById("right-top-right-corner");
    const rightLayout = document.getElementById("bottom-right-layout");

    // REMOVE CLICK
    removeLayout.addEventListener("click", function () {

        removeLayout.style.display = "none";
        addLayout.style.display = "flex";

        rightLayout.style.display = "none";

    });

    // ADD CLICK
    addLayout.addEventListener("click", function () {

        addLayout.style.display = "none";
        removeLayout.style.display = "flex";

        rightLayout.style.display = "flex";

    });

})();
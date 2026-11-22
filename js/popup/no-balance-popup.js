
(() => {

    const popupParent = document.getElementById("popup-parent");
    const popupStack = document.getElementById("noBalancePopupStack");
    const popupTemplate = document.getElementById("noBalancePopup");

    if (!popupParent || !popupStack || !popupTemplate) {
        console.error("No Balance Popup elements not found!");
        return;
    }

    // ================= Settings =================

    const MAX_POPUP = 3;
    const POPUP_LIFE = 1800; // Popup visible থাকার সময়

    let pendingPopup = 0;


    // ================= Show Popup =================

    function showNoBalancePopup() {

        pendingPopup++;

        showNextPopup();
    }


    // ================= Next Popup =================

    function showNextPopup() {

        if (pendingPopup <= 0) return;

        if (popupStack.children.length >= MAX_POPUP) return;

        pendingPopup--;

        const popup = popupTemplate.cloneNode(true);

        popup.removeAttribute("id");
        popup.classList.add("no-balance-popup-item");

        popup.style.display = "flex";
        popup.style.visibility = "hidden";
        popup.style.opacity = "0";
        popup.style.transform = "translateY(0px)";

        popupStack.appendChild(popup);


        // ================= Reveal Animation =================

        requestAnimationFrame(() => {

            const h = popup.offsetHeight;

            popup.style.clipPath = "inset(0 0 100% 0)";
            popup.style.transform = `translateY(${h}px)`;
            popup.style.opacity = "0.3";
            popup.style.visibility = "visible";

            const revealAnimation = popup.animate(
                [
                    {
                        clipPath: "inset(0 0 100% 0)",
                        transform: `translateY(${h}px)`,
                        opacity: 0.3
                    },
                    {
                        clipPath: "inset(0 0 0 0)",
                        transform: "translateY(0px)",
                        opacity: 0.8
                    }
                ],
                {
                    duration: 350,
                    easing: "cubic-bezier(0, 0, 0.2, 1)",
                    fill: "forwards"
                }
            );


            // ================= Fully Visible =================

            revealAnimation.onfinish = () => {

                popup.animate(
                    [
                        { opacity: 0.8 },
                        { opacity: 1 }
                    ],
                    {
                        duration: 120,
                        fill: "forwards"
                    }
                ).onfinish = () => {

                    setTimeout(() => {

                        removePopup(popup);

                    }, POPUP_LIFE);

                };

            };

        });


        // ================= Fill Remaining Slots =================

        showNextPopup();
    }


    // ================= Remove Popup =================

function removePopup(popup) {

    // অন্য Popup-গুলোর আগের অবস্থান ধরে রাখবে
    const remainingPopups = [
        ...popupStack.children
    ].filter(item => item !== popup);

    const oldPositions = new Map();

    remainingPopups.forEach(item => {
        oldPositions.set(
            item,
            item.getBoundingClientRect().top
        );
    });


    // ================= Move Up Animation =================

    popup.animate(
        [
            { transform: "translateY(0px)" },
            { transform: "translateY(-70px)" }
        ],
        {
            duration: 300,
            fill: "forwards"
        }
    ).onfinish = () => {

        // ================= Scale Down + Fade Out =================

        popup.animate(
            [
                {
                    transform: "translateY(-70px) scale(1)",
                    opacity: 1
                },
                {
                    transform: "translateY(-70px) scale(0.7)",
                    opacity: 0
                }
            ],
            {
                duration: 250,
                fill: "forwards"
            }
        ).onfinish = () => {

            // Popup remove করবে
            popup.remove();

            // ================= Smooth Remaining Popups =================

            remainingPopups.forEach(item => {

                const oldTop = oldPositions.get(item);
                const newTop = item.getBoundingClientRect().top;

                const difference = oldTop - newTop;

                item.animate(
                    [
                        {
                            transform: `translateY(${difference}px)`
                        },
                        {
                            transform: "translateY(0px)"
                        }
                    ],
                    {
                        duration: 350,
                        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                        fill: "none"
                    }
                );

            });

            // পরবর্তী Queue Popup দেখাবে
            showNextPopup();

        };

    };

}


    // ================= Public Function =================

    window.showNoBalancePopup = showNoBalancePopup;

})();

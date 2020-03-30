import calculations from "../shared/calculations";
import betaviz from "../shared/betaviz";

/**
 * This script may run more than one time within the same context (e.g, if use goes to another results page)
 * To avoid namespace issues, we check if window.injectConfidenceInterval already exists (meaning the
 * script has run before and doesn't need to be re-declared)
 */
if (!window.injectConfidenceInterval) {
    window.injectConfidenceInterval = async () => {
        const productsSelector =
            "div.a-section.a-spacing-none.a-spacing-top-micro>.a-row.a-size-small";

        let productsDOM = document.querySelectorAll(productsSelector);

        // Wait until product ratings have been loaded into the DOM
        while (!productsDOM.length) {
            await new Promise(r => setTimeout(r, 500));
            productsDOM = document.querySelectorAll(productsSelector);
        }

        // Create color scale
        const cmap = "interpolateSpectral";

        /**
         * For each product, create a beta distribution visualization and insert it into the DOM
         */
        for (let product of productsDOM) {
            const ratingText = product.querySelector("span.a-icon-alt").innerText;

            const rating = +ratingText.split(" out of")[0]; //score out of 5
            const reviewsText = product.querySelector("span.a-size-base").innerText; //number of reviews
            const reviews = parseFloat(reviewsText.replace(/[,.]/g, ""));
            const confidenceDOM = document.createElement("div");
            // confidenceDOM.innerHTML = betaviz.createBasicText({"avg": rating}, reviews, "avg");
            const betaParams = calculations.getBetaParams({"avg": rating}, reviews, "avg");
            betaviz.addViz(confidenceDOM, betaParams, cmap);
            product.insertAdjacentElement("beforeend", confidenceDOM);
        }
    };
}


// noinspection JSIgnoredPromiseFromCall
injectConfidenceInterval()

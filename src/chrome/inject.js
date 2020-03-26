import calculations from "../shared/calculations"
import scraper from "../shared/scraper"


/**
 * This script may run more than one time within the same context (e.g, if use goes to another results page)
 * To avoid namespace issues, we check if window.injectConfidenceInterval already exists (meaning the
 * script has run before and doesn't need to be re-declared)
 */
if (!window.injectConfidenceInterval) {
    window.injectConfidenceInterval = async () => {
        const products = await scraper.findAllProducts()
        for (let product of products) {
            const confidenceDOM = document.createElement("div");
            const ci = calculations.evaluateAverageRating(product.rating, product.reviewCount)
            confidenceDOM.innerHTML = `CI for score ${product.rating}, n=${product.reviewCount} is <br> proportion: ${ci.proportion} <br> lower: ${ci.lower} <br> upper: ${ci.upper}`;
            product.dom.insertAdjacentElement("beforeend", confidenceDOM);
        }
    };
}

// noinspection JSIgnoredPromiseFromCall
window.injectConfidenceInterval()
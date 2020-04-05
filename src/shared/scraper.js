

/** @typedef Product
 *  @property dom  DOM element that contains the relevant data
 *  @property {number} rating  Average rating. If there are not reviews, this will be null.
 *  @property {number} reviewCount  Number of reviews
 *  @property {array} distributions  Fractions of each star rating over all ratings. Indices 0-5 => 1-5 stars
 */


export default {

    /**
     * Find all products on the page and extract some basic stats
     * @returns {Promise<Product>}
     */
    async findAllProducts(){
        return new Promise((resolve, reject) => {
            if (document.readyState == "loading"){
                document.addEventListener('DOMContentLoaded', run)
            } else {
                run()
            }
            function run(){
                //TODO sometimes products are featured together, and this selects the entire block instead of each product
                const images = document.querySelectorAll('[data-component-type=s-product-image]')
                const products = [...images].map(image => image.closest('div'))
                resolve( products.map(product =>{
                    const stats = getStats(product)
                    return {
                        dom: product,
                        rating: stats.rating,
                        reviewCount: stats.reviewCount,
                        distributions: []
                    }
                }) )
            }
        })
    },

    /**
     * Loads rating distributions into the given product object
     * @param {Product} product  If distributions are found, they will be added to this object
     */
    async loadDistributions(product){
        if(!product.reviewCount)  return
        const popover = JSON.parse(product.dom.querySelector('.a-spacing-top-micro [data-a-popover]').dataset.aPopover)
        if(!popover.url)  return
        const body = await fetch(popover.url).then(response => response.text())
        // noinspection JSCheckFunctionSignatures
        const dom = (new DOMParser()).parseFromString(body, 'text/html')
        const distributions = dom.documentElement.querySelectorAll('#histogramTable td.a-text-right .a-size-base')
        product.distributions = [...distributions].map( distribution => parseFloat(distribution.innerText) / 100 ).reverse()
    }

}



function getStats(product) {
    let rating, reviewCount
    const section = product.querySelector(".a-section.a-spacing-none.a-spacing-top-micro > .a-row.a-size-small")
    if(section){
        const stats = section.children
        rating = stats[0].getAttribute('aria-label').split(" out of")[0] * 1
        reviewCount = parseFloat(stats[1].getAttribute('aria-label').replace(/[,.]/g, ""))
    }
    else {
        rating = null
        reviewCount = 0
    }
    return {rating, reviewCount}
}


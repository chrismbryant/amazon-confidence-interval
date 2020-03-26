

/** @typedef Product
 *  @property dom  DOM element that contains the relevant data
 *  @property {number} rating  Average rating. If there are not reviews, this will be null.
 *  @property {number} reviewCount  Number of reviews
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
                const images = document.querySelectorAll('[data-component-type=s-product-image]')
                const products = [...images].map(image => image.closest('.a-section'))
                resolve(products.map(product =>{
                    const stats = getStats(product)
                    return {
                        dom: product,
                        rating: stats.rating,
                        reviewCount: stats.reviewCount
                    }
                }))
            }
        })
    }

}



function getStats(product) {
    let rating, reviewCount
    const section = product.querySelector(".a-section.a-spacing-none.a-spacing-top-micro>.a-row.a-size-small")
    if(section){
        rating = product.querySelector("span.a-icon-alt").innerText.split(" out of")[0] * 1
        reviewCount = parseFloat(product.querySelector("span.a-size-base").innerText.replace(/[,.]/g, ""))
    }
    else {
        rating = null
        reviewCount = 0
    }
    return {rating, reviewCount}
}




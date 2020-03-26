

/** @typedef Product
 *  @property dom  DOM element that contains the relevant data
 *  @property {number} rating  Average rating
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
                const products = document.querySelectorAll("div.a-section.a-spacing-none.a-spacing-top-micro>.a-row.a-size-small")
                resolve([...products].map(product =>{
                    const rating = product.querySelector("span.a-icon-alt")
                    const reviews = product.querySelector("span.a-size-base")
                    if(!rating || !reviews)  return
                    return {
                        dom: product,
                        rating: +rating.innerText.split(" out of")[0],
                        reviewCount: parseFloat(reviews.innerText.replace(/[,.]/g, ""))
                    }
                }))
            }
        })
    }

}





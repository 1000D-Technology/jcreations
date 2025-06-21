import React from 'react'
import Categoryitem from './utils/Categoryitem'
import Categoryitem2 from "./utils/Categoryitem2.jsx";

function Category({ onCategoryClick }) {
    return (
        <>
            {/* Desktop view */}
            <section className="pt-15  lg:flex justify-center">
                <div className="max-w-7xl w-full lg:flex justify-between px-2">
                    <div className="flex flex-col w-full">
                        <span className="px-2 text-2xl">
                            Categories
                        </span>
                        <div className="w-full flex justify-center ">
                            <Categoryitem2 onCategoryClick={onCategoryClick} />
                        </div>
                    </div>
                </div>
            </section>

            {/* Mobile view with title first, then fixed category bar */}
            <section className="md:hidden  ">




                {/* Fixed container for categories positioned below header */}
                <div className="fixed left-0 right-0 top-0 z-40 bg-white py-3">
                    <Categoryitem onCategoryClick={onCategoryClick} />
                </div>
            </section>
        </>
    )
}

export default Category
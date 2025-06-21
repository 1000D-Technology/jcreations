import React, { useState } from "react";
import Hero from "../component/Hero.jsx";
import Newarrivals from "../component/Newarrivals.jsx";
import Category from "../component/Category.jsx";
import Allproducts from '../component/Allproducts.jsx';
import Search from "../component/Search.jsx";

function Home() {
    // State for search modal and selected category
    const [searchOpen, setSearchOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);

    // Handle category click
    const handleCategoryClick = (categoryData) => {
        // Set the selected category ID
        setSelectedCategory(categoryData.id);
        // Open search modal
        setSearchOpen(true);
    };

    return (
        <div>
            <main>
                <Hero />
                <Category onCategoryClick={handleCategoryClick} />
                <Newarrivals />
                <Allproducts />

                {/* Search component with initialCategory */}
                <Search
                    isOpen={searchOpen}
                    onClose={() => setSearchOpen(false)}
                    initialCategory={selectedCategory}
                />
            </main>
        </div>
    );
}

export default Home;
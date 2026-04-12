export default function CategorySidebar({ 
    categories, 
    selectedCategories, 
    toggleCategory 
}) {
    return (
        <div className="w-64 bg-zinc-900 border-r border-zinc-800 p-6 overflow-y-auto min-h-[calc(100vh-64px)]">
            <h2 className="!text-white text-2xl font-semibold leading-tight mb-4">
                Select Up to 5 Categories
            </h2>

            <p className="text-zinc-500 text-sm mb-6">
                Choose up to 5 categories of interest
            </p>

            <div className="space-y-2">
                {categories
                    .filter((cat) => cat.value !== "all")
                    .map((category) => {
                        const isSelected = selectedCategories.includes(category.value);
                        const isDisabled =
                            !isSelected && selectedCategories.length >= 5;

                    return (
                        <button
                            key={category.id}
                            onClick={() => toggleCategory(category.value)}
                            disabled={isDisabled}
                            className={`w-full text-left px-4 py-3 rounded-lg transition-all text-sm ${
                                isSelected
                                    ? "bg-blue-600 text-white"
                                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            }`}
                        >
                            {category.name}
                        </button>
                    );
                })}
            </div>

            <div className="mt-6 text-sm text-zinc-500">
                {selectedCategories.length} of 5 categories selected
            </div>
            </div>
    );
}
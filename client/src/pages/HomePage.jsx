import NavigationBar from "../components/NavigationBar";
import CategorySidebar from "../components/CategorySidebar";
import { useState } from "react";

const categories = [
  { id: 1, name: "All", value: "all" },
  { id: 2, name: "Technology", value: "technology" },
  { id: 3, name: "Science", value: "science" },
  { id: 4, name: "Business", value: "business" },
  { id: 5, name: "World", value: "world" },
  { id: 6, name: "Politics", value: "politics" },
  { id: 7, name: "Health", value: "health" },
  { id: 8, name: "Entertainment", value: "entertainment" },
  { id: 9, name: "Sports", value: "sports" },
  { id: 10, name: "Environment", value: "environment" },
  { id: 11, name: "Education", value: "education" },
  { id: 12, name: "Economy", value: "economy" },
  { id: 13, name: "Cybersecurity", value: "cybersecurity" },
  { id: 14, name: "Space", value: "space" },
  { id: 15, name: "Energy", value: "energy" },
];

const articlesSummaries = [
    "Article 1 Summary",
    "Article 2 Summary",
    "Article 3 Summary",
    "Article 4 Summary",
    "Article 5 Summary",
];

const articlesKeyTakeaways = [
    "Article 1 Key Takeaway",
    "Article 2 Key Takeaway",
    "Article 3 Key Takeaway",
    "Article 4 Key Takeaway",
    "Article 5 Key Takeaway",
];

export default function HomePage() {
    const [selectedCategories, setSelectedCategories] = useState([]);

    function toggleCategory(categoryValue) {
        if (selectedCategories.includes(categoryValue)) {
            // remove category
            setSelectedCategories(selectedCategories.filter((value) => value !== categoryValue));
            return
        }

        if (selectedCategories.length < 5) {
            // add category
            setSelectedCategories([...selectedCategories, categoryValue]);
        }
    }
    
    return (
        <div className="w-full min-h-screen px-4 sm:px-6 lg:px-8 py-8 bg-zinc-950 border-b border-zinc-800">
            <NavigationBar />

            <div className="flex">
                <CategorySidebar
                    categories={categories}
                    selectedCategories={selectedCategories}
                    toggleCategory={toggleCategory}
                />
                <main className="flex-1 p-6">
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Main content area */}
                         <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Summary panel */}
                            <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 min-h-[500px]">
                                <h2 className="text-2xl font-semibold !text-white mb-6">
                                    Summaries
                                </h2>

                                <div className="space-y-4">
                                    {articlesSummaries.map((summary, index) => (
                                        <div
                                            key={index}
                                            className="bg-zinc-800 border border-zinc-700 rounded-xl p-4"
                                        >
                                            <p className="text-blue-400 text-sm font-medium mb-2">
                                                Article {index + 1}
                                            </p>
                                            <p className="text-zinc-200">{summary}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                            
                            {/* Key takeaways panel */}
                            <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 min-h-[500px]">
                                <h2 className="text-2xl font-semibold !text-white mb-6">
                                    Key Takeaways
                                </h2>

                                <div className="space-y-4">
                                    {articlesKeyTakeaways.map((takeaway, index) => (
                                        <div
                                            key={index}
                                            className="bg-zinc-800 border border-zinc-700 rounded-xl p-4"
                                        >
                                            <p className="text-blue-400 text-sm font-medium mb-2">
                                                Article {index + 1}
                                            </p>
                                            <p className="text-zinc-200">{takeaway}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    
                        {/* Bias indicator on right */}
                        <aside className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 min-h-[500px]">
                            <h2 className="text-2xl font-semibold !text-white mb-6">
                                Bias Indicator
                            </h2>

                            <div className="space-y-5">
                                <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4">
                                    <p className="text-zinc-400 text-sm mb-2">Overall Bias</p>
                                    <div className="w-full h-3 rounded-full bg-gradient-to-r from-blue-500 via-zinc-500 to-red-500 mb-3" />
                                        <p className="text-white font-medium">Center</p>

                                    <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4">
                                        <p className="text-zinc-400 text-sm mb-2">Article Analysis</p>
                                        <ul className="space-y-3 text-zinc-300 text-sm">
                                            <li>Article 1: Slightly Left</li>
                                            <li>Article 2: Center</li>
                                            <li>Article 3: Slightly Right</li>
                                            <li>Article 4: Center</li>
                                            <li>Article 5: Left</li>
                                        </ul>
                                    </div>
                                
                                    <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4">
                                        <p className="text-zinc-400 text-sm mb-2">What This Means</p>
                                        <p className="text-zinc-300 text-sm leading-6">
                                            This section will later explain the overall political or
                                            editorial leaning of the selected articles and whether the
                                            coverage appears balanced.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                </main>
            </div> 
        </div>
    );
}
let globalCombinedData = [];  // or window.globalCombinedData

document.addEventListener("DOMContentLoaded", function () {
    const confirmButton = document.getElementById("confirmButton");
    const resetButton = document.getElementById("resetButton"); // New Reset button
    
    const recommendationSectionTab1 = document.querySelector("#tab1 .section-recommendation");
    
    confirmButton.addEventListener("click", function () {
        const dropdowns = document.querySelectorAll("#tab1 .profile-config select");
        const interestArea = dropdowns[0].value.toLowerCase();
        const sectorInterest = dropdowns[1].value.toLowerCase();
        const targetMarket = dropdowns[2].value.toLowerCase();

        console.log("Captured Values (lowercase):", { interestArea, sectorInterest, targetMarket });

        // Step 1: Load mapping_subindustry.csv
        console.log("Loading mapping_subindustry.csv...");
        Papa.parse("assets/mapping_subindustry.csv", {
            download: true,
            header: true,
            complete: function (mappingResults) {
                console.log("Mapping File Loaded Successfully:", mappingResults.data);
                const mappingData = mappingResults.data;
                
                const subIndustries = mappingData.filter((row) => row["Industry"]?.toLowerCase() === sectorInterest).map((row) => row["Sub Industry"]);

                if (!subIndustries.length) {
                    console.error("No matching Sub-Industries found for:", sectorInterest);
                    return;
                }

                console.log("Sub-Industries for the selected Industry:", subIndustries);
                displayFilterButtons(subIndustries);
                // Step 2: Map sectorInterest to Industry (case-insensitive)
                // const subIndustryMatch = mappingData.find(
                //     (row) => row["Option Value"]?.toLowerCase() === sectorInterest
                // );

                // if (!subIndustryMatch) {
                //     console.error("No matching Industry found for:", sectorInterest);
                //     return;
                // }

                // const subIndustryValue = subIndustryMatch["Industry"].toLowerCase();
                
                const allButton = document.querySelector(".filter-button[data-value='all']");
                if (allButton) {
                    allButton.click(); // Simulate a click to activate the "All" filter
                }

                const subIndustryValue = sectorInterest.toLowerCase();
                console.log("Mapped Industry Value (lowercase):", subIndustryValue);

                // Step 3: Load resourcelist.csv
                console.log("Loading resourcelist.csv...");
                Papa.parse("assets/resourcelist.csv", {
                    download: true,
                    header: true,
                    complete: function (results) {
                        console.log("Resource List Loaded Successfully:", results.data);
                        const resourceList = results.data;

                        // Step 4: Filter entries with "Capability Area" = "Internationalisation" (case-insensitive)
                        const filteredResources = resourceList.filter((row) => {
                            const valid =
                                row["Capability Area"]?.toLowerCase() === "internationalisation";
                            return valid;
                        });

                        console.log("Filtered Resources for Internationalisation:", filteredResources);

                        if (filteredResources.length === 0) {
                            console.warn("No Resources Found for Capability Area = Internationalisation.");
                        }

                        // Step 5: Process each resource file
                        const combinedData = [];
                        const fileReadPromises = filteredResources.map((resource) => {
                            const filePath = `assets/${resource["Path"]}`;
                            console.log("Processing Resource File:", filePath);
                        
                            // Extract Resource Category from file path
                            const resourceCategory = filePath.split("/").pop().split(".")[0]; // Extracts filename without extension
                            console.log("Derived Resource Category:", resourceCategory);
                        
                            return new Promise((resolve) => {
                                Papa.parse(filePath, {
                                    download: true,
                                    header: true,
                                    complete: function (fileResults) {
                                        console.log(`File Loaded: ${filePath}`, fileResults.data);
                        
                                        const filteredEntries = fileResults.data.filter((row) => {
                                            const capabilityAreaMatch =
                                                row["Capability Area"]?.toLowerCase() === "internationalisation";
                        
                                            const subCapabilityMatch = row["Industry"]
                                                ?.toLowerCase()
                                                .split(",")
                                                .map((value) => value.trim())
                                                .includes(subIndustryValue) || row["Industry"]?.toLowerCase() === "all";
                        
                                            const marketsMatch = row["Markets"]
                                                ?.toLowerCase()
                                                .split(",")
                                                .map((value) => value.trim())
                                                .includes(targetMarket) || row["Markets"]?.toLowerCase() === "all";
                        
                                            const valid = capabilityAreaMatch && subCapabilityMatch && marketsMatch;
                        
                                            return valid;
                                        });
                        
                                        // Add Resource Category column to each filtered entry
                                        const labeledEntries = filteredEntries.map((entry) => ({
                                            ...entry,
                                            "Resource Category": resourceCategory,
                                        }));
                        
                                        console.log(`Filtered and Labeled Entries from ${filePath}:`, labeledEntries);
                                        resolve(labeledEntries);
                                    },
                                });
                            });
                        });
                        

                        // Step 6: Combine results and display
                        Promise.all(fileReadPromises).then((allData) => {
                            console.log("All Resource Files Processed. Combining Results...");
                            allData.forEach((data) => combinedData.push(...data));
                            console.log("Combined Dataframe:", combinedData);
                        
                            if (combinedData.length === 0) {
                                console.warn("No Data Found After Filtering All Resource Files.");
                            }
                        
                            // >>> ADD THIS <<<
                            globalCombinedData = combinedData;
                        
                            displayRecommendations(combinedData);
                        });
                        
                    },
                });
            },
        });
    });
    resetButton.addEventListener("click", function () {
        resetForm(); // Call resetForm function when Reset button is clicked
    });
    
    
});
// Function to display results dynamically
function displayRecommendations(data) {
    const recommendationContainer = document.querySelector(
        "#tab1 .section-recommendation .recommendation-content"
    );

    // Clear any existing recommendations
    recommendationContainer.innerHTML = "";

    if (data.length === 0) {
        console.log("No recommendations to display.");
        recommendationContainer.innerHTML = `<p>No recommendations found for the selected criteria.</p>`;
        return;
    }

    console.log("Displaying Recommendations...");

    // Step 1: Group data by 'Resource Category' (or replace with actual column name)
    const groupedData = {};
    data.forEach((item) => {
        const category = item["Resource Category"] || "Uncategorized"; // Replace column name if needed
        // console.log(groupedData[category]);
        if (!groupedData[category]) groupedData[category] = [];
        groupedData[category].push(item);
    });

    console.log("Grouped Data by Category:", groupedData);

    // Step 2: Select one entry per category
    const selectedRecommendations = [];
    const remainingEntries = [];

    Object.values(groupedData).forEach((entries) => {
        if (entries.length > 0) {
            const randomIndex = Math.floor(Math.random() * entries.length);
            const selectedItem = entries.splice(randomIndex, 1)[0];
            selectedRecommendations.push(selectedItem);

            remainingEntries.push(...entries);
        }
    });

    // Step 3: Randomly fill remaining slots to reach a maximum of 6
    while (selectedRecommendations.length < 6 && remainingEntries.length > 0) {
        const randomIndex = Math.floor(Math.random() * remainingEntries.length);
        selectedRecommendations.push(remainingEntries.splice(randomIndex, 1)[0]);
    }

    console.log("Final Selected Recommendations (Max 6):", selectedRecommendations);

    // Step 4: Display the recommendations
    selectedRecommendations.forEach((item, index) => {
        const recommendationItem = document.createElement("div");
        recommendationItem.classList.add("recommendation-item");

        // Add sub-industry data attribute for filtering
        recommendationItem.dataset.subIndustry = item["Sub Industry"]?.toLowerCase() || "all";
        // Lookup the corresponding resource label from resourcelist.csv
        recommendationItem.innerHTML = `
            <div class="ribbon">${item["Resource Type"]}</div>
            <h4>${item["Reco Title"] || `Recommendation ${index + 1}`}</h4>
            <p class="subtitle">${item["Reco Subtitle"] || "No Resource Name Provided"}</p>
            <p class="description">${item["Reco Description"] || "No description available."}</p>
            <a href="${item["Reco Link"] || "#"}" class="recommendation-link" target="_blank">
                View Details
            </a>
        `;

        recommendationContainer.appendChild(recommendationItem);
    });

    document.querySelector("#tab1 .section-recommendation").classList.remove("hidden");
}


function showTab(tabId) {
    // Get all tabs and links
    const tabs = document.querySelectorAll('.tab-content');
    const navLinks = document.querySelectorAll('.nav-tabs a');

    // Hide all tabs and remove 'active' class from links
    tabs.forEach((tab) => tab.classList.remove('active'));
    navLinks.forEach((link) => link.classList.remove('active'));

    // Show the selected tab and mark the link as active
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`.nav-tabs a[href="#${tabId}"]`).classList.add('active');
}

function resetForm() {
    console.log("Resetting form and recommendations...");

    // Reset all dropdowns to their default values
    const dropdowns = document.querySelectorAll("#tab1 .profile-config select");
    dropdowns.forEach((dropdown) => {
        dropdown.selectedIndex = 0; // Resets to the first option
    });

    // Clear the recommendations content
    const recommendationContainer = document.querySelector(
        "#tab1 .section-recommendation .recommendation-content"
    );
    recommendationContainer.innerHTML = "";

    // Hide the recommendations section
    document.querySelector("#tab1 .section-recommendation").classList.add("hidden");

    console.log("Form reset and recommendations hidden.");
}

function applyProfile() {
    const userId = document.getElementById("user-id").value.trim();
    if (!userId) {
        document.getElementById("profile-status").innerText = "Please enter a valid User ID.";
        return;
    }

    Papa.parse("assets/userprofile_mapping.csv", {
        download: true,
        header: true,
        complete: function(results) {
            const data = results.data;
            const userProfile = data.find(row => row["User ID"] === userId);

            if (userProfile) {
                // Extract the relevant fields
                const subCapability = userProfile["Sub Capability"];
                const subIndustry = userProfile["Sub Industry"];
                const markets = userProfile["Markets"];

                // Store for now (or process for recommendations)
                document.getElementById("profile-status").innerText = `Profile found!`
                // Sub Capability: ${subCapability}
                // Sub Industry: ${subIndustry}
                // Markets: ${markets}`;

                // Trigger the recommendation logic with the extracted parameters
               
            } else {
                document.getElementById("profile-status").innerText = "No profile found for the given User ID.";
            }
        },
        error: function(error) {
            console.error("Error parsing CSV:", error);
            document.getElementById("profile-status").innerText = "Error loading the profile. Please try again.";
        }
    });
}

document.addEventListener("DOMContentLoaded", function () {
    const applyButton = document.querySelector("#tab2 button");

    applyButton.addEventListener("click", function () {
        const userId = document.getElementById("user-id").value.trim();
        if (!userId) {
            document.getElementById("profile-status").innerText = "Please enter a valid User ID.";
            return;
        }

        console.log("Fetching profile for User ID:", userId);

        // Step 1: Parse `userprofile_mapping.csv`
        Papa.parse("assets/userprofile_mapping.csv", {
            download: true,
            header: true,
            complete: function (results) {
                const data = results.data;
                const userProfile = data.find(row => row["User ID"] === userId);

                if (!userProfile) {
                    document.getElementById("profile-status").innerText = "No profile found for the given User ID.";
                    console.error("User profile not found.");
                    return;
                }

                const subCapability = userProfile["Sub Capability"].toLowerCase();
                const subIndustry = userProfile["Sub Industry"].toLowerCase();
                const targetMarket = userProfile["Markets"].toLowerCase();

                console.log("Captured Values from Profile (lowercase):", {
                    subCapability,
                    subIndustry,
                    targetMarket
                });

                // Step 2: Load `mapping_subindustry.csv` and start recommendation process
                console.log("Loading mapping_subindustry.csv...");
                Papa.parse("assets/mapping_subindustry.csv", {
                    download: true,
                    header: true,
                    complete: function (mappingResults) {
                        const mappingData = mappingResults.data;

                        const subIndustryMatch = mappingData.find(
                            row => row["Option Value"]?.toLowerCase() === subIndustry
                        );

                        if (!subIndustryMatch) {
                            console.error("No matching Sub Industry found for:", subIndustry);
                            return;
                        }

                        const subIndustryValue = subIndustryMatch["Sub Industry"].toLowerCase();
                        console.log("Mapped Sub Industry Value (lowercase):", subIndustryValue);

                        // Step 3: Load `resourcelist.csv` and continue the recommendation process
                        console.log("Loading resourcelist.csv...");
                        Papa.parse("assets/resourcelist.csv", {
                            download: true,
                            header: true,
                            complete: function (results) {
                                console.log("Resource List Loaded Successfully:", results.data);
                                const resourceList = results.data;
        
                                // Step 4: Filter entries with "Capability Area" = "Internationalisation" (case-insensitive)
                                const filteredResources = resourceList.filter((row) => {
                                    const valid =
                                        row["Capability Area"]?.toLowerCase() === "internationalisation";
                                    return valid;
                                });
        
                                console.log("Filtered Resources for Internationalisation:", filteredResources);
        
                                if (filteredResources.length === 0) {
                                    console.warn("No Resources Found for Capability Area = Internationalisation.");
                                }
        
                                // Step 5: Process each resource file
                                const combinedData = [];
                                const fileReadPromises = filteredResources.map((resource) => {
                                    const filePath = `assets/${resource["Path"]}`;
                                    console.log("Processing Resource File:", filePath);
                                
                                    // Extract Resource Category from file path
                                    const resourceCategory = filePath.split("/").pop().split(".")[0]; // Extracts filename without extension
                                    console.log("Derived Resource Category:", resourceCategory);
                                
                                    return new Promise((resolve) => {
                                        Papa.parse(filePath, {
                                            download: true,
                                            header: true,
                                            complete: function (fileResults) {
                                                console.log(`File Loaded: ${filePath}`, fileResults.data);
                                
                                                const filteredEntries = fileResults.data.filter((row) => {
                                                    const capabilityAreaMatch =
                                                        row["Capability Area"]?.toLowerCase() === "internationalisation";
                                
                                                    const subCapabilityMatch = row["Sub Industry"]
                                                        ?.toLowerCase()
                                                        .split(",")
                                                        .map((value) => value.trim())
                                                        .includes(subIndustryValue) || row["Sub Industry"]?.toLowerCase() === "all";
                                                    
                                                    const marketsMatch = row["Markets"]
                                                        ?.toLowerCase()
                                                        .split(",")
                                                        .map((value) => value.trim())
                                                        .includes(targetMarket) || row["Markets"]?.toLowerCase() === "all";
                                
                                                    const valid = capabilityAreaMatch && subCapabilityMatch && marketsMatch;
                                
                                                    return valid;
                                                });
                                
                                                // Add Resource Category column to each filtered entry
                                                const labeledEntries = filteredEntries.map((entry) => ({
                                                    ...entry,
                                                    "Resource Category": resourceCategory,
                                                }));
                                
                                                console.log(`Filtered and Labeled Entries from ${filePath}:`, labeledEntries);
                                                resolve(labeledEntries);
                                            },
                                        });
                                    });
                                });
                                
        
                                // Step 6: Combine results and display
                                Promise.all(fileReadPromises).then((allData) => {
                                    console.log("All Resource Files Processed. Combining Results...");
                                    allData.forEach((data) => combinedData.push(...data));
                                    console.log("Combined Dataframe:", combinedData);
        
                                    if (combinedData.length === 0) {
                                        console.warn("No Data Found After Filtering All Resource Files.");
                                    }
        
                                    displayRecommendations(combinedData);
                                });
                            },
                        });
                    },
                });
            },
        });
    });

    function displayRecommendations(data) {
        const recommendationContainer = document.querySelector(
            "#tab2 .section-recommendation .recommendation-content"
        );
    
        recommendationContainer.innerHTML = ""; // Clear any existing recommendations
    
        if (data.length === 0) {
            console.log("No recommendations to display.");
            recommendationContainer.innerHTML = `<p>No recommendations found for the selected criteria.</p>`;
            return;
        }
    
        console.log("Displaying Recommendations...");
    
        // Step 1: Group data by 'Resource Category' (or replace with actual column name)
        const groupedData = {};
        data.forEach((item) => {
            
            const category = item["Resource Category"] || "Uncategorized"; // Replace column name if needed
            if (!groupedData[category]) groupedData[category] = [];
            groupedData[category].push(item);
        });
    
        console.log("Grouped Data by Category:", groupedData);
    
        // Step 2: Select one entry per category
        const selectedRecommendations = [];
        const remainingEntries = [];
    
        Object.values(groupedData).forEach((entries) => {
            if (entries.length > 0) {
                // Randomize the first selection from this category
                const randomIndex = Math.floor(Math.random() * entries.length);
                const selectedItem = entries.splice(randomIndex, 1)[0];
                selectedRecommendations.push(selectedItem);
        
                console.log(`Randomly selected entry for category:`, selectedItem);
        
                // Push remaining entries into the pool
                remainingEntries.push(...entries);
            }
        });
        
    
        console.log("Selected Recommendations (1 per category):", selectedRecommendations);
        console.log("Remaining Entries for Random Selection:", remainingEntries);
    
        // Step 3: Randomly fill remaining slots to reach 6
        while (selectedRecommendations.length < 6 && remainingEntries.length > 0) {
            const randomIndex = Math.floor(Math.random() * remainingEntries.length);
            selectedRecommendations.push(remainingEntries.splice(randomIndex, 1)[0]);
        }
    
        console.log("Final Selected Recommendations:", selectedRecommendations);
    
        // Step 4: Display the recommendations
        selectedRecommendations.forEach((item, index) => {
            const recommendationItem = document.createElement("div");
            recommendationItem.classList.add("recommendation-item");
            
            recommendationItem.innerHTML = `
                <div class="ribbon">New</div>
                <h4>${item["Reco Title"] || `Recommendation ${index + 1}`}</h4>
                <p class="subtitle">${item["Reco Subtitle"] || "No Resource Name Provided"}</p>
                <p class="description">${item["Reco Description"] || "No description available."}</p>
                <a href="${item["Reco Link"] || "#"}" class="recommendation-link" target="_blank">
                    View Details
                </a>
            `;

            recommendationContainer.appendChild(recommendationItem);
        });
    
        document.querySelector("#tab2 .section-recommendation").classList.remove("hidden");
    }
});

function displayFilterButtons(subIndustries) {
    const filterContainer = document.querySelector(".filter-buttons");
    const sectionRecommendation = document.querySelector(".section-recommendation");

    // Clear existing buttons to avoid duplication
    filterContainer.innerHTML = "";

    if (!subIndustries || subIndustries.length === 0) {
        console.warn("No sub-industries provided.");
        return;
    }

    // Helper to handle button activation
    const handleButtonClick = (button) => {
        // Remove 'active' from all buttons
        document.querySelectorAll(".filter-button").forEach((btn) => btn.classList.remove("active"));
        // Add 'active' to the clicked button
        button.classList.add("active");
    };

    // Create the "All" button
    const allButton = document.createElement("button");
    allButton.classList.add("filter-button");
    allButton.textContent = "All";
    allButton.dataset.value = "all";
    allButton.addEventListener("click", () => {
        handleButtonClick(allButton); // Activate the clicked button
        filterRecommendations("all");
    });
    filterContainer.appendChild(allButton);

    // Create a button for each sub-industry
    subIndustries.forEach((subIndustry) => {
        const button = document.createElement("button");
        button.classList.add("filter-button");
        button.textContent = subIndustry;
        button.dataset.value = subIndustry.toLowerCase();
        button.addEventListener("click", () => {
            handleButtonClick(button); // Activate the clicked button
            filterRecommendations(button.dataset.value);
        });
        filterContainer.appendChild(button);
    });

    // Make the recommendation section visible
    sectionRecommendation.classList.remove("hidden");

    console.log("Filter buttons created and displayed:", subIndustries);
}


function filterRecommendations(subIndustry) {
    const newlyFiltered = globalCombinedData.filter((item) => {
        const subIndustryField = (item["Sub Industry"] || "").toLowerCase();
        const tags = subIndustryField.split(",").map(s => s.trim());
        return tags.includes(subIndustry) || tags.includes("all") || subIndustry === "all";
    });

    // Re-run the same pick-6 logic
    displayRecommendations(newlyFiltered);
}

document.addEventListener("DOMContentLoaded", function () {
    const overlay = document.getElementById("overlay");

    // Function to navigate to the selected tab
    window.navigateToTab = function (tabId) {
        // Hide the overlay
        overlay.style.display = "none";

        // Show the selected tab
        showTab(tabId);
    };

    // Function to show a tab and hide others
    window.showTab = function (tabId) {
        const tabs = document.querySelectorAll(".tab-content");
        const navLinks = document.querySelectorAll(".nav-tabs a");

        tabs.forEach(tab => tab.classList.remove("active"));
        navLinks.forEach(link => link.classList.remove("active"));

        document.getElementById(tabId).classList.add("active");
        document.querySelector(`.nav-tabs a[href="#${tabId}"]`).classList.add("active");
    };
});


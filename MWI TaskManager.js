// ==UserScript==
// @name         MWI TaskManager
// @namespace    http://tampermonkey.net/
// @version      0.18
// @description  sort all task in taskboard
// @author       shykai (Modified by Akkay)
// @match        https://www.milkywayidle.com/*
// @match        https://test.milkywayidle.com/*
// @icon         https://www.milkywayidle.com/favicon.svg
// @grant        GM_getValue
// @grant        GM_setValue
// @updateURL    https://raw.githubusercontent.com/Akkayz/MWI-TaskManager/refs/heads/main/MWI%20TaskManager.js
// @downloadURL  https://raw.githubusercontent.com/Akkayz/MWI-TaskManager/refs/heads/main/MWI%20TaskManager.js
// ==/UserScript==

(function () {
    'use strict';

    //default config
    let globalConfig = {
        isBattleIcon: true,
        isAutoSort: true, // New option for auto sorting
        customTaskOrder: {}, // Add customTaskOrder to globalConfig
        dungeonConfig: {
            "/actions/combat/chimerical_den": false,
            "/actions/combat/sinister_circus": false,
            "/actions/combat/enchanted_fortress": false,
        }
    };

    // Biến để theo dõi trạng thái sắp xếp
    let sortState = {
        isSorted: false,
        lastTaskCount: 0,
        lastTaskIds: []
    };

    // Biến để theo dõi phần tử đang được kéo
    let draggedItem = null;

    const globalConfigName = "MWITaskManager_globalConfig";
    function saveConfig() {
        GM_setValue(globalConfigName, JSON.stringify(globalConfig));
    }

    const savedConfig = GM_getValue(globalConfigName, null);
    if (savedConfig) {
        Object.assign(globalConfig, JSON.parse(savedConfig));
    }

    const taskBattleIndex = 99; //Battle at bottom
    const taskOrderIndex = {
        Milking: 1,
        Foraging: 2,
        Woodcutting: 3,
        Cheesesmithing: 4,
        Crafting: 5,
        Tailoring: 6,
        Cooking: 7,
        Brewing: 8,
        Alchemy: 9,
        Enhancing: 10,
        Defeat: taskBattleIndex, //Battle at bottom
    };

    const allMonster = {
        "/monsters/abyssal_imp": {
            "en": "Abyssal Imp",
            "zone": "/actions/combat/infernal_abyss",
            "dungeon": [
                "/actions/combat/enchanted_fortress"
            ],
            "sortIndex": 11
        },
        "/monsters/aquahorse": {
            "en": "Aquahorse",
            "zone": "/actions/combat/aqua_planet",
            "dungeon": [
                "/actions/combat/chimerical_den"
            ],
            "sortIndex": 3
        },
        "/monsters/black_bear": {
            "en": "Black Bear",
            "zone": "/actions/combat/bear_with_it",
            "dungeon": [
                "/actions/combat/sinister_circus"
            ],
            "sortIndex": 8
        },
        "/monsters/gobo_boomy": {
            "en": "Boomy",
            "zone": "/actions/combat/gobo_planet",
            "dungeon": [
                "/actions/combat/sinister_circus"
            ],
            "sortIndex": 5
        },
        "/monsters/butterjerry": {
            "en": "Butterjerry",
            "zone": "",
            "dungeon": [
                "/actions/combat/chimerical_den"
            ],
            "sortIndex": -1
        },
        "/monsters/centaur_archer": {
            "en": "Centaur Archer",
            "zone": "/actions/combat/jungle_planet",
            "dungeon": [
                "/actions/combat/chimerical_den"
            ],
            "sortIndex": 4
        },
        "/monsters/chronofrost_sorcerer": {
            "en": "Chronofrost Sorcerer",
            "zone": "/actions/combat/sorcerers_tower",
            "sortIndex": 7
        },
        "/monsters/crystal_colossus": {
            "en": "Crystal Colossus",
            "zone": "/actions/combat/golem_cave",
            "sortIndex": 9
        },
        "/monsters/demonic_overlord": {
            "en": "Demonic Overlord",
            "zone": "/actions/combat/infernal_abyss",
            "sortIndex": 11
        },
        "/monsters/dusk_revenant": {
            "en": "Dusk Revenant",
            "zone": "/actions/combat/twilight_zone",
            "sortIndex": 10
        },
        "/monsters/elementalist": {
            "en": "Elementalist",
            "zone": "/actions/combat/sorcerers_tower",
            "dungeon": [
                "/actions/combat/sinister_circus"
            ],
            "sortIndex": 7
        },
        "/monsters/enchanted_pawn": {
            "en": "Enchanted Pawn",
            "zone": "",
            "dungeon": [
                "/actions/combat/enchanted_fortress"
            ],
            "sortIndex": -1
        },
        "/monsters/eye": {
            "en": "Eye",
            "zone": "/actions/combat/planet_of_the_eyes",
            "dungeon": [
                "/actions/combat/enchanted_fortress"
            ],
            "sortIndex": 6
        },
        "/monsters/eyes": {
            "en": "Eyes",
            "zone": "/actions/combat/planet_of_the_eyes",
            "dungeon": [
                "/actions/combat/enchanted_fortress"
            ],
            "sortIndex": 6
        },
        "/monsters/flame_sorcerer": {
            "en": "Flame Sorcerer",
            "zone": "/actions/combat/sorcerers_tower",
            "dungeon": [
                "/actions/combat/enchanted_fortress",
                "/actions/combat/sinister_circus"
            ],
            "sortIndex": 7
        },
        "/monsters/fly": {
            "en": "Fly",
            "zone": "/actions/combat/smelly_planet",
            "sortIndex": 1
        },
        "/monsters/frog": {
            "en": "Frogger",
            "zone": "/actions/combat/swamp_planet",
            "dungeon": [
                "/actions/combat/chimerical_den"
            ],
            "sortIndex": 2
        },
        "/monsters/sea_snail": {
            "en": "Gary",
            "zone": "/actions/combat/aqua_planet",
            "sortIndex": 3
        },
        "/monsters/giant_shoebill": {
            "en": "Giant Shoebill",
            "zone": "/actions/combat/swamp_planet",
            "sortIndex": 2
        },
        "/monsters/gobo_chieftain": {
            "en": "Gobo Chieftain",
            "zone": "/actions/combat/gobo_planet",
            "sortIndex": 5
        },
        "/monsters/granite_golem": {
            "en": "Granite Golem",
            "zone": "/actions/combat/golem_cave",
            "sortIndex": 9
        },
        "/monsters/grizzly_bear": {
            "en": "Grizzly Bear",
            "zone": "/actions/combat/bear_with_it",
            "dungeon": [
                "/actions/combat/sinister_circus"
            ],
            "sortIndex": 8
        },
        "/monsters/gummy_bear": {
            "en": "Gummy Bear",
            "zone": "/actions/combat/bear_with_it",
            "dungeon": [
                "/actions/combat/chimerical_den",
                "/actions/combat/sinister_circus"
            ],
            "sortIndex": 8
        },
        "/monsters/crab": {
            "en": "I Pinch",
            "zone": "/actions/combat/aqua_planet",
            "sortIndex": 3
        },
        "/monsters/ice_sorcerer": {
            "en": "Ice Sorcerer",
            "zone": "/actions/combat/sorcerers_tower",
            "dungeon": [
                "/actions/combat/enchanted_fortress",
                "/actions/combat/sinister_circus"
            ],
            "sortIndex": 7
        },
        "/monsters/infernal_warlock": {
            "en": "Infernal Warlock",
            "zone": "/actions/combat/infernal_abyss",
            "sortIndex": 11
        },
        "/monsters/jackalope": {
            "en": "Jackalope",
            "zone": "",
            "dungeon": [
                "/actions/combat/chimerical_den"
            ],
            "sortIndex": -1
        },
        "/monsters/rat": {
            "en": "Jerry",
            "zone": "/actions/combat/smelly_planet",
            "dungeon": [
                "/actions/combat/chimerical_den"
            ],
            "sortIndex": 1
        },
        "/monsters/jungle_sprite": {
            "en": "Jungle Sprite",
            "zone": "/actions/combat/jungle_planet",
            "dungeon": [
                "/actions/combat/chimerical_den"
            ],
            "sortIndex": 4
        },
        "/monsters/luna_empress": {
            "en": "Luna Empress",
            "zone": "/actions/combat/jungle_planet",
            "sortIndex": 4
        },
        "/monsters/magnetic_golem": {
            "en": "Magnetic Golem",
            "zone": "/actions/combat/golem_cave",
            "dungeon": [
                "/actions/combat/enchanted_fortress"
            ],
            "sortIndex": 9
        },
        "/monsters/marine_huntress": {
            "en": "Marine Huntress",
            "zone": "/actions/combat/aqua_planet",
            "sortIndex": 3
        },
        "/monsters/myconid": {
            "en": "Myconid",
            "zone": "/actions/combat/jungle_planet",
            "sortIndex": 4
        },
        "/monsters/nom_nom": {
            "en": "Nom Nom",
            "zone": "/actions/combat/aqua_planet",
            "sortIndex": 3
        },
        "/monsters/novice_sorcerer": {
            "en": "Novice Sorcerer",
            "zone": "/actions/combat/sorcerers_tower",
            "dungeon": [
                "/actions/combat/enchanted_fortress",
                "/actions/combat/sinister_circus"
            ],
            "sortIndex": 7
        },
        "/monsters/panda": {
            "en": "Panda",
            "zone": "/actions/combat/bear_with_it",
            "dungeon": [
                "/actions/combat/sinister_circus"
            ],
            "sortIndex": 8
        },
        "/monsters/polar_bear": {
            "en": "Polar Bear",
            "zone": "/actions/combat/bear_with_it",
            "dungeon": [
                "/actions/combat/sinister_circus"
            ],
            "sortIndex": 8
        },
        "/monsters/porcupine": {
            "en": "Porcupine",
            "zone": "/actions/combat/smelly_planet",
            "dungeon": [
                "/actions/combat/chimerical_den"
            ],
            "sortIndex": 1
        },
        "/monsters/rabid_rabbit": {
            "en": "Rabid Rabbit",
            "zone": "",
            "dungeon": [
                "/actions/combat/sinister_circus"
            ],
            "sortIndex": -1
        },
        "/monsters/red_panda": {
            "en": "Red Panda",
            "zone": "/actions/combat/bear_with_it",
            "sortIndex": 8
        },
        "/monsters/alligator": {
            "en": "Sherlock",
            "zone": "/actions/combat/swamp_planet",
            "sortIndex": 2
        },
        "/monsters/gobo_shooty": {
            "en": "Shooty",
            "zone": "/actions/combat/gobo_planet",
            "dungeon": [
                "/actions/combat/sinister_circus"
            ],
            "sortIndex": 5
        },
        "/monsters/skunk": {
            "en": "Skunk",
            "zone": "/actions/combat/smelly_planet",
            "sortIndex": 1
        },
        "/monsters/gobo_slashy": {
            "en": "Slashy",
            "zone": "/actions/combat/gobo_planet",
            "dungeon": [
                "/actions/combat/sinister_circus"
            ],
            "sortIndex": 5
        },
        "/monsters/slimy": {
            "en": "Slimy",
            "zone": "/actions/combat/smelly_planet",
            "sortIndex": 1
        },
        "/monsters/gobo_smashy": {
            "en": "Smashy",
            "zone": "/actions/combat/gobo_planet",
            "dungeon": [
                "/actions/combat/sinister_circus"
            ],
            "sortIndex": 5
        },
        "/monsters/soul_hunter": {
            "en": "Soul Hunter",
            "zone": "/actions/combat/infernal_abyss",
            "dungeon": [
                "/actions/combat/enchanted_fortress"
            ],
            "sortIndex": 11
        },
        "/monsters/gobo_stabby": {
            "en": "Stabby",
            "zone": "/actions/combat/gobo_planet",
            "dungeon": [
                "/actions/combat/sinister_circus"
            ],
            "sortIndex": 5
        },
        "/monsters/stalactite_golem": {
            "en": "Stalactite Golem",
            "zone": "/actions/combat/golem_cave",
            "dungeon": [
                "/actions/combat/enchanted_fortress"
            ],
            "sortIndex": 9
        },
        "/monsters/swampy": {
            "en": "Swampy",
            "zone": "/actions/combat/swamp_planet",
            "dungeon": [
                "/actions/combat/chimerical_den"
            ],
            "sortIndex": 2
        },
        "/monsters/the_watcher": {
            "en": "The Watcher",
            "zone": "/actions/combat/planet_of_the_eyes",
            "sortIndex": 6
        },
        "/monsters/snake": {
            "en": "Thnake",
            "zone": "/actions/combat/swamp_planet",
            "sortIndex": 2
        },
        "/monsters/treant": {
            "en": "Treant",
            "zone": "/actions/combat/jungle_planet",
            "sortIndex": 4
        },
        "/monsters/turtle": {
            "en": "Turuto",
            "zone": "/actions/combat/aqua_planet",
            "sortIndex": 3
        },
        "/monsters/vampire": {
            "en": "Vampire",
            "zone": "/actions/combat/twilight_zone",
            "dungeon": [
                "/actions/combat/sinister_circus"
            ],
            "sortIndex": 10
        },
        "/monsters/veyes": {
            "en": "Veyes",
            "zone": "/actions/combat/planet_of_the_eyes",
            "dungeon": [
                "/actions/combat/enchanted_fortress"
            ],
            "sortIndex": 6
        },
        "/monsters/werewolf": {
            "en": "Werewolf",
            "zone": "/actions/combat/twilight_zone",
            "dungeon": [
                "/actions/combat/sinister_circus"
            ],
            "sortIndex": 10
        },
        "/monsters/zombie": {
            "en": "Zombie",
            "zone": "/actions/combat/twilight_zone",
            "dungeon": [
                "/actions/combat/sinister_circus"
            ],
            "sortIndex": 10
        },
        "/monsters/zombie_bear": {
            "en": "Zombie Bear",
            "zone": "",
            "dungeon": [
                "/actions/combat/sinister_circus"
            ],
            "sortIndex": -1
        }
    };

    function getTaskDetailFromTaskName(fullTaskName) {
        var taskType = -1;
        var taskName = "";

        if (/^(.+) - (.+)$/.test(fullTaskName)) {
            let res = /^(.+) - (.+)$/.exec(fullTaskName);
            if (res[1] in taskOrderIndex) {
                taskType = taskOrderIndex[res[1]];
            }
            taskName = res[2];
        }
        if (taskType == -1) console.log("Task Parse error", fullTaskName);

        return { taskType, taskName };
    }

    function getHridFromMonsterName(name) {
        for (let key in allMonster) {
            if (allMonster[key].en === name) {
                return key;
            }
        }
        console.log("Monster not found", name);
        return null;
    }
    function getMapIndexFromMonsterName(name) {
        const key = getHridFromMonsterName(name);
        if (!key) {
            return -1;
        }
        return allMonster[key].sortIndex;
    }

    function getTaskDetailFromElement(ele) {
        const div = ele.querySelector("div.RandomTask_name__1hl1b");

        const translatedfrom = div.getAttribute("script_translatedfrom"); //adapt old zhCN Script
        if (translatedfrom) {
            return getTaskDetailFromTaskName(translatedfrom);
        }

        const fullTaskName = Array.from(div.childNodes).find(node => node.nodeType === Node.TEXT_NODE).textContent.trim();
        return getTaskDetailFromTaskName(fullTaskName);
    }

    // Cập nhật hàm compareFn để chỉ sử dụng thứ tự tùy chỉnh
    function compareFn(a, b) {
        var { taskType: a_TypeIndex, taskName: a_taskName } = getTaskDetailFromElement(a);
        var { taskType: b_TypeIndex, taskName: b_TaskName } = getTaskDetailFromElement(b);

        // Get task type names
        const a_TypeName = Object.keys(taskOrderIndex).find(key => taskOrderIndex[key] === a_TypeIndex);
        const b_TypeName = Object.keys(taskOrderIndex).find(key => taskOrderIndex[key] === b_TypeIndex);

        // Sử dụng thứ tự tùy chỉnh nếu có, nếu không sử dụng thứ tự mặc định
        const a_Order = globalConfig.customTaskOrder[a_TypeName] || taskOrderIndex[a_TypeName];
        const b_Order = globalConfig.customTaskOrder[b_TypeName] || taskOrderIndex[b_TypeName];

        if (a_Order !== b_Order) {
            return a_Order - b_Order;
        }

        // Nếu cùng loại nhiệm vụ và là nhiệm vụ chiến đấu, sắp xếp theo khu vực
        if (a_TypeIndex === taskBattleIndex && b_TypeIndex === taskBattleIndex) {
            var a_MapIndex = getMapIndexFromMonsterName(a_taskName);
            var b_MapIndex = getMapIndexFromMonsterName(b_TaskName);

            if (a_MapIndex != b_MapIndex) {
                return (a_MapIndex > b_MapIndex ? 1 : -1);
            }
        }

        // Nếu cùng loại, sắp xếp theo tên
        if (a_TypeIndex == b_TypeIndex) {
            return a_taskName == b_TaskName ? 0
            : (a_taskName > b_TaskName ? 1 : -1);
        }

        return a_Order - b_Order;
    }

    function addIconToTask(div) {
        var { taskType, taskName } = getTaskDetailFromElement(div);

        if (taskType != taskBattleIndex) {
            return;
        }

        const monsterHrid = getHridFromMonsterName(taskName);
        if (!monsterHrid) {
            return;
        }

        var offset = 5; // 5% from left and each 30% width
        const isShowDungeon = Object.values(globalConfig.dungeonConfig).filter(Boolean).length > 0;
        if (!isShowDungeon) {
            offset = 50;
        }

        const backgroundDiv = document.createElement('div');
        backgroundDiv.id = "MonsterIcon";
        backgroundDiv.style.position = 'absolute';
        backgroundDiv.style.left = `${offset}%`; offset += 30;
        backgroundDiv.style.width = '30%';
        backgroundDiv.style.height = '100%';
        backgroundDiv.style.opacity = '0.3';

        const monsterName = monsterHrid.split("/").pop();
        const svgContent = `<svg width="100%" height="100%"><use href="/static/media/combat_monsters_sprite.395438a8.svg#${monsterName}"></use></svg>`;
        backgroundDiv.innerHTML = svgContent;

        div.appendChild(backgroundDiv);


        const dungeonMap = allMonster[monsterHrid]?.dungeon;
        if (isShowDungeon && dungeonMap) {
            Object.keys(globalConfig.dungeonConfig).filter(dungeon => globalConfig.dungeonConfig[dungeon]).forEach(dungeon => {
                if (dungeonMap.includes(dungeon)) {
                    const dungeonDiv = document.createElement('div');
                    dungeonDiv.id = "DungeonIcon";
                    dungeonDiv.style.position = 'absolute';
                    dungeonDiv.style.left = `${offset}%`; offset += 30;
                    dungeonDiv.style.width = '30%';
                    dungeonDiv.style.height = '100%';
                    dungeonDiv.style.opacity = '0.3';

                    const dungeonName = dungeon.split("/").pop();
                    const svgContent = `<svg width="100%" height="100%"><use href="/static/media/actions_sprite.8d5ceb4a.svg#${dungeonName}"></use></svg>`;
                    dungeonDiv.innerHTML = svgContent;

                    div.appendChild(dungeonDiv);
                }
            })
        }

        // fix button style
        div.style.position = 'relative';
        div.querySelector(".RandomTask_content__VVQva").style.zIndex = 1;
        div.querySelectorAll(".Item_item__2De2O").forEach(node => node.style.backgroundColor = "transparent");

    }

    function updateIconByConfig() {
        const battleIcon = document.querySelector("#BattleIcon");
        if (battleIcon) {
            if (globalConfig.isBattleIcon) {
                battleIcon.style.opacity = '1';
                battleIcon.querySelector("#taskCount").style.display = 'inline';
            } else {
                battleIcon.style.opacity = '0.3';
                battleIcon.querySelector("#taskCount").style.display = 'none';
            }
        }

        Object.keys(globalConfig.dungeonConfig).forEach(dungeon => {
            const dungeonIcon = document.querySelector(`#${dungeon.split("/").pop()}`);
            if (dungeonIcon) {
                if (globalConfig.isBattleIcon && globalConfig.dungeonConfig[dungeon]) {
                    dungeonIcon.style.opacity = '1';
                    dungeonIcon.querySelector("#taskCount").style.display = 'inline';
                } else {
                    dungeonIcon.style.opacity = '0.3';
                    dungeonIcon.querySelector("#taskCount").style.display = 'none';
                }
            }
        });
    }

    function createIcon(id,href) {

        // battle icon
        const div = document.createElement("div");
        div.id = id;
        div.style.height = "100%"; // 设置高度

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("role", "img");
        svg.setAttribute("aria-label", "Combat");
        svg.setAttribute("class", "Icon_icon__2LtL_ Icon_xtiny__331pI Icon_inline__1Idwv");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.style.margin = "1px";

        const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
        use.setAttribute("href", href);
        svg.appendChild(use);

        const divCount = document.createElement("span");
        divCount.id = "taskCount";
        divCount.textContent = "";

        div.appendChild(svg);
        div.appendChild(divCount);

        // div onclick change config
        div.addEventListener("click", function (evt) {
            if (id === "BattleIcon") {
                globalConfig.isBattleIcon = !globalConfig.isBattleIcon;
            } else {
                let configkey = Object.keys(globalConfig.dungeonConfig).find(key => key.split("/").pop() === id);
                globalConfig.dungeonConfig[configkey] = !globalConfig.dungeonConfig[configkey];
            }
            saveConfig(); //auto save when click

            updateIconByConfig();

            //clean all checkers to refresh statics
            document.querySelectorAll("#taskChekerInCoin").forEach(checker => checker.id = null);
        });

        return div;
    }

    // Hàm tạo ID duy nhất cho mỗi task dựa trên nội dung
    function generateTaskId(taskElement) {
        const { taskType, taskName } = getTaskDetailFromElement(taskElement);
        return `${taskType}_${taskName}`;
    }

    // Hàm kiểm tra xem danh sách có thay đổi không
    function hasTaskListChanged(taskElements) {
        if (taskElements.length !== sortState.lastTaskCount) {
            return true;
        }

        // Tạo danh sách ID mới từ các task hiện tại
        const currentIds = taskElements.map(task => generateTaskId(task));
        
        // So sánh với danh sách cũ
        if (sortState.lastTaskIds.length !== currentIds.length) {
            return true;
        }
        
        // Kiểm tra xem có task nào thay đổi không
        for (let i = 0; i < currentIds.length; i++) {
            if (!sortState.lastTaskIds.includes(currentIds[i])) {
                return true;
            }
        }
        
        return false;
    }

    // Hàm cập nhật trạng thái đã sắp xếp
    function updateSortState(isSorted, taskElements) {
        sortState.isSorted = isSorted;
        sortState.lastTaskCount = taskElements.length;
        sortState.lastTaskIds = taskElements.map(task => generateTaskId(task));
        
        // Thêm dấu hiệu đã sắp xếp vào container
        const taskContainer = document.querySelector("div.TasksPanel_taskList__2xh4k");
        if (taskContainer) {
            if (isSorted) {
                taskContainer.setAttribute("data-sorted", "true");
            } else {
                taskContainer.removeAttribute("data-sorted");
            }
        }
    }

    function applyCustomOrder() {
        // Lấy tất cả các task hiện tại
        const list = document.querySelector("div.TasksPanel_taskList__2xh4k");
        if (!list) return;

        const tasks = [...list.querySelectorAll("div.RandomTask_randomTask__3B9fA")];
        if (tasks.length === 0) return;

        // Sắp xếp lại theo thứ tự mới
        tasks.sort(compareFn).forEach(node => list.appendChild(node));
        
        // Cập nhật trạng thái đã sắp xếp
        updateSortState(true, tasks);
    }

    // Cập nhật hàm sortTasks để sử dụng applyCustomOrder
    function sortTasks() {
        applyCustomOrder();
    }

    function addSortButtonAndStaticsBar(pannel) {
        // Create container for sort controls
        const sortButtonContainer = document.createElement("div");
        sortButtonContainer.style.display = "flex";
        sortButtonContainer.style.alignItems = "center";
        sortButtonContainer.style.marginRight = "5px";
        
        // Create sort button
        const sortButton = document.createElement("button");
        sortButton.setAttribute("class", "Button_button__1Fe9z Button_small__3fqC7");
        sortButton.id = "TaskSort";
        sortButton.innerHTML = "Sort";
        sortButton.addEventListener("click", function (evt) {
            sortTasks();
        });
        
        // Create auto-sort toggle
        const autoSortLabel = document.createElement("label");
        autoSortLabel.style.display = "flex";
        autoSortLabel.style.alignItems = "center";
        autoSortLabel.style.marginLeft = "5px";
        autoSortLabel.style.cursor = "pointer";
        autoSortLabel.title = "Auto-sort tasks when navigating";
        
        const autoSortCheckbox = document.createElement("input");
        autoSortCheckbox.type = "checkbox";
        autoSortCheckbox.id = "AutoSortCheckbox";
        autoSortCheckbox.checked = globalConfig.isAutoSort;
        autoSortCheckbox.style.margin = "0 3px 0 0";
        
        autoSortCheckbox.addEventListener("change", function(evt) {
            globalConfig.isAutoSort = this.checked;
            saveConfig();
            if (globalConfig.isAutoSort) {
                sortTasks();
            }
        });
        
        const autoSortText = document.createTextNode("Auto");
        autoSortLabel.appendChild(autoSortCheckbox);
        autoSortLabel.appendChild(autoSortText);
        
        // Create sort priority button
        const priorityButton = document.createElement("button");
        priorityButton.setAttribute("class", "Button_button__1Fe9z Button_small__3fqC7");
        priorityButton.id = "SortPriority";
        priorityButton.innerHTML = "Priority";
        priorityButton.style.marginLeft = "5px";
        priorityButton.addEventListener("click", function(evt) {
            showSortPriorityDialog();
        });
        
        sortButtonContainer.appendChild(sortButton);
        sortButtonContainer.appendChild(autoSortLabel);
        sortButtonContainer.appendChild(priorityButton);
        pannel.appendChild(sortButtonContainer);

        // add statics bar
        const battleIcon = createIcon("BattleIcon", "/static/media/misc_sprite.426c5d78.svg#combat");
        pannel.appendChild(battleIcon);

        // add all dungeon icon
        Object.keys(globalConfig.dungeonConfig).forEach(dungeon => {
            const dungeonIcon = createIcon(dungeon.split("/").pop(), `/static/media/actions_sprite.8d5ceb4a.svg#${dungeon.split("/").pop()}`);
            pannel.appendChild(dungeonIcon);
        });
    }

    function showSortPriorityDialog() {
        // Remove existing dialog if any
        const existingDialog = document.querySelector("#sortPriorityDialog");
        if (existingDialog) {
            existingDialog.remove();
            return;
        }

        // Create dialog container
        const dialog = document.createElement("div");
        dialog.id = "sortPriorityDialog";
        dialog.style.position = "fixed";
        dialog.style.top = "50%";
        dialog.style.left = "50%";
        dialog.style.transform = "translate(-50%, -50%)";
        dialog.style.backgroundColor = "white";
        dialog.style.padding = "20px";
        dialog.style.borderRadius = "5px";
        dialog.style.boxShadow = "0 0 10px rgba(0,0,0,0.5)";
        dialog.style.zIndex = "1000";
        dialog.style.maxHeight = "80vh";
        dialog.style.overflowY = "auto";
        dialog.style.minWidth = "200px";

        // Create title
        const title = document.createElement("h3");
        title.textContent = "Sort Order";
        title.style.marginTop = "0";
        title.style.marginBottom = "15px";
        title.style.textAlign = "center";
        dialog.appendChild(title);

        // Create container for sortable items
        const sortableContainer = document.createElement("div");
        sortableContainer.id = "sortableTaskTypes";
        sortableContainer.style.marginBottom = "10px";
        dialog.appendChild(sortableContainer);

        // Create items for each task type
        const taskTypes = Object.keys(taskOrderIndex);
        taskTypes.sort((a, b) => {
            const aOrder = globalConfig.customTaskOrder[a] || taskOrderIndex[a];
            const bOrder = globalConfig.customTaskOrder[b] || taskOrderIndex[b];
            return aOrder - bOrder;
        }).forEach((taskType, index) => {
            const container = document.createElement("div");
            container.className = "sortable-item";
            container.draggable = true;
            container.style.marginBottom = "8px";
            container.style.padding = "8px 12px";
            container.style.backgroundColor = "#f5f5f5";
            container.style.borderRadius = "4px";
            container.style.cursor = "move";
            container.style.display = "flex";
            container.style.alignItems = "center";
            container.style.transition = "all 0.2s ease";
            container.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
            container.style.userSelect = "none"; // Prevent text selection while dragging
            container.dataset.taskType = taskType;

            // Hover effect
            container.addEventListener('mouseenter', () => {
                if (draggedItem !== container) {
                    container.style.backgroundColor = "#e9e9e9";
                    container.style.transform = "translateX(5px)";
                }
            });
            container.addEventListener('mouseleave', () => {
                if (draggedItem !== container) {
                    container.style.backgroundColor = "#f5f5f5";
                    container.style.transform = "translateX(0)";
                }
            });

            // Add order number
            const orderSpan = document.createElement("span");
            orderSpan.className = "order-number";
            orderSpan.style.minWidth = "25px";
            orderSpan.style.marginRight = "10px";
            orderSpan.style.color = "#666";
            orderSpan.style.fontWeight = "bold";
            orderSpan.textContent = (index + 1).toString();
            container.appendChild(orderSpan);

            // Add task type name
            const label = document.createElement("span");
            label.textContent = taskType;
            container.appendChild(label);

            // Add drag handle icon
            const dragHandle = document.createElement("span");
            dragHandle.innerHTML = "⋮⋮"; // Unicode dots for drag handle
            dragHandle.style.marginLeft = "auto";
            dragHandle.style.color = "#999";
            dragHandle.style.cursor = "move";
            container.appendChild(dragHandle);

            // Add drag and drop events
            container.addEventListener('dragstart', handleDragStart);
            container.addEventListener('dragover', handleDragOver);
            container.addEventListener('drop', handleDrop);
            container.addEventListener('dragend', handleDragEnd);

            sortableContainer.appendChild(container);
        });

        // Create save button
        const saveButton = document.createElement("button");
        saveButton.textContent = "Save";
        saveButton.setAttribute("class", "Button_button__1Fe9z Button_small__3fqC7");
        saveButton.style.width = "100%";
        saveButton.style.marginTop = "10px";
        saveButton.addEventListener("click", function() {
            // Save custom order
            const items = [...sortableContainer.querySelectorAll('.sortable-item')];
            globalConfig.customTaskOrder = {}; // Reset custom order
            items.forEach((item, index) => {
                const taskType = item.dataset.taskType;
                globalConfig.customTaskOrder[taskType] = index + 1;
            });
            
            // Lưu cấu hình
            saveConfig();
            
            // Áp dụng thay đổi ngay lập tức
            applyCustomOrder();
            
            // Đóng dialog
            dialog.remove();
        });

        dialog.appendChild(saveButton);
        document.body.appendChild(dialog);

        // Close dialog when clicking outside
        document.addEventListener("click", function closeDialog(e) {
            if (!dialog.contains(e.target) && e.target.id !== "SortPriority") {
                dialog.remove();
                document.removeEventListener("click", closeDialog);
            }
        });
    }

    function handleDragStart(e) {
        e.stopPropagation();
        draggedItem = this;
        this.style.opacity = '0.4';
        this.style.transform = "scale(0.95)";
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        if (this === draggedItem) return;

        const rect = this.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        
        this.style.transition = "transform 0.2s ease";
        
        if (e.clientY < midpoint) {
            this.style.transform = "translateY(-5px)";
            this.style.borderTop = "2px solid #4a90e2";
            this.style.borderBottom = "";
        } else {
            this.style.transform = "translateY(5px)";
            this.style.borderBottom = "2px solid #4a90e2";
            this.style.borderTop = "";
        }
    }

    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        if (!draggedItem || this === draggedItem) return;

        const rect = this.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        
        if (e.clientY < midpoint) {
            this.parentNode.insertBefore(draggedItem, this);
        } else {
            this.parentNode.insertBefore(draggedItem, this.nextSibling);
        }

        // Reset styles
        this.style.transform = "";
        this.style.borderTop = "";
        this.style.borderBottom = "";
        
        // Update order numbers
        updateOrderNumbers();
    }

    function handleDragEnd(e) {
        if (!draggedItem) return;
        
        draggedItem.style.opacity = '';
        draggedItem.style.transform = "";
        
        const items = document.querySelectorAll('.sortable-item');
        items.forEach(item => {
            item.style.transform = "";
            item.style.borderTop = "";
            item.style.borderBottom = "";
        });
        
        draggedItem = null;
    }

    function updateOrderNumbers() {
        const items = document.querySelectorAll('.sortable-item');
        items.forEach((item, index) => {
            const orderSpan = item.querySelector('.order-number');
            if (orderSpan) {
                orderSpan.textContent = (index + 1).toString();
            }
        });
    }

    function optimizeForMobile(pannel) {
        if (/Mobi|Android/i.test(navigator.userAgent)) {
            const upgradeButton = pannel.querySelector("button.Button_button__1Fe9z.Button_small__3fqC7");
            if (upgradeButton) {
                upgradeButton.style.display = "none";
                console.log("hide upgrade button when mobile");
            }
        }
    }

    function refresh() {
        const pannel = document.querySelector("div.TasksPanel_taskSlotCount__nfhgS");
        if (pannel) {
            let sortButton = pannel.querySelector("#TaskSort");
            if (!sortButton) {
                optimizeForMobile(pannel);
                addSortButtonAndStaticsBar(pannel);
                updateIconByConfig();
                
                // Reset trạng thái sắp xếp khi mới load panel
                sortState.isSorted = false;
                
                // Nếu auto sort được bật, kiểm tra và sắp xếp nếu cần
                if (globalConfig.isAutoSort) {
                    setTimeout(() => {
                        applyCustomOrder();
                    }, 100);
                }
            }
        }
        else {
            return; //not in task board
        }

        let needRefreshTaskStatics = false;
        let isTasksChanged = false;
        const taskNodes = document.querySelectorAll("div.TasksPanel_taskList__2xh4k div.RandomTask_randomTask__3B9fA");
        for (let node of taskNodes) {
            const coinDiv = node.querySelector(".Item_count__1HVvv");
            if (coinDiv && !coinDiv.querySelector("#taskChekerInCoin")) {
                needRefreshTaskStatics = true;
                isTasksChanged = true;

                //remove old and add new icon
                const oldIcon = node.querySelector("#MonsterIcon");
                if (oldIcon) {
                    oldIcon.remove();
                }
                const oldDungeonIcons = node.querySelectorAll("#DungeonIcon");
                oldDungeonIcons.forEach(icon => icon.remove());

                if (globalConfig.isBattleIcon) {
                    addIconToTask(node);
                }

                //add checker
                const checker = document.createElement("div");
                checker.id = "taskChekerInCoin";
                coinDiv.appendChild(checker);
            }
        }

        // Đánh dấu trạng thái chưa sắp xếp nếu có thay đổi
        if (isTasksChanged) {
            sortState.isSorted = false;
            const taskContainer = document.querySelector("div.TasksPanel_taskList__2xh4k");
            if (taskContainer) {
                taskContainer.removeAttribute("data-sorted");
            }
            
            // Auto sort nếu được bật và có thay đổi
            if (globalConfig.isAutoSort) {
                sortTasks();
            }
        }

        if (needRefreshTaskStatics)
        {
            const battleIcon = document.querySelector("#BattleIcon #taskCount");
            if (battleIcon) {
                const battleCount = [...document.querySelectorAll("div.RandomTask_randomTask__3B9fA")].filter(node => node.querySelector("#MonsterIcon")).length;
                battleIcon.textContent = battleCount > 0 ? `*${battleCount}` : '';
            }

            Object.keys(globalConfig.dungeonConfig).forEach(dungeon => {
                const dungeonIcon = document.querySelector(`#${dungeon.split("/").pop()} #taskCount`);
                if (dungeonIcon) {
                    const dungeonCount = [...document.querySelectorAll("div.RandomTask_randomTask__3B9fA")].filter(node => {
                        const dungeonIcons = node.querySelectorAll("#DungeonIcon use");
                        return Array.from(dungeonIcons).some(icon => icon.getAttribute("href").includes(dungeon.split("/").pop()));
                    }).length;
                    dungeonIcon.textContent = dungeonCount > 0 ? `*${dungeonCount}` : '';
                }
            });
        }
    }

    const config = { attributes: true, childList: true, subtree: true };

    const observer = new MutationObserver(function (mutationsList, observer) {
        refresh();
    });

    observer.observe(document, config);

})();

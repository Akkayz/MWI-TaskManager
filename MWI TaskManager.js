// ==UserScript==
// @name         MWI TaskManager
// @namespace    http://tampermonkey.net/
// @version      0.19
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
  "use strict";

  // Default configuration
  let globalConfig = {
    isBattleIcon: true,
    isAutoSort: true, // Option for auto sorting
    customTaskOrder: {}, // Custom task order
    dungeonConfig: {
      "/actions/combat/chimerical_den": false,
      "/actions/combat/sinister_circus": false,
      "/actions/combat/enchanted_fortress": false,
    },
    isTaskTokenAsc: false, // Option to sort Task Token ascending/descending
    autoReroll: {
      enabled: false, // Auto-reroll tasks with low token rewards
      minTokenThreshold: 7, // Minimum token threshold for auto-reroll
      delayBetweenRerolls: 1000, // Delay between rerolls in milliseconds
      maxCoinThreshold: 160000, // Stop rerolling when coins reach this amount
    },
  };

  // Variable to track sort state
  let sortState = {
    isSorted: false,
    lastTaskCount: 0,
    lastTaskIds: [],
  };

  // Variable to track the currently dragged element
  let draggedItem = null;

  const globalConfigName = "MWITaskManager_globalConfig";
  function saveConfig() {
    GM_setValue(globalConfigName, JSON.stringify(globalConfig));
  }

  const savedConfig = GM_getValue(globalConfigName, null);
  if (savedConfig) {
    Object.assign(globalConfig, JSON.parse(savedConfig));
  }

  const taskBattleIndex = 99; // Battle at bottom
  const taskOrderIndex = {
    Milking: 1,
    Foraging: 2,
    Woodcutting: 3,
    Cheesesmithing: 4,
    Crafting: 5,
    Tailoring: 6,
    Cooking: 7,
    Brewing: 8,
    Combat: taskBattleIndex, //Battle at bottom
  };

  const allMonster = {
    "/monsters/abyssal_imp": {
      en: "Abyssal Imp",
      zone: "/actions/combat/infernal_abyss",
      dungeon: ["/actions/combat/enchanted_fortress"],
      sortIndex: 11,
    },
    "/monsters/aquahorse": {
      en: "Aquahorse",
      zone: "/actions/combat/aqua_planet",
      dungeon: ["/actions/combat/chimerical_den"],
      sortIndex: 3,
    },
    "/monsters/black_bear": {
      en: "Black Bear",
      zone: "/actions/combat/bear_with_it",
      dungeon: ["/actions/combat/sinister_circus"],
      sortIndex: 8,
    },
    "/monsters/gobo_boomy": {
      en: "Boomy",
      zone: "/actions/combat/gobo_planet",
      dungeon: ["/actions/combat/sinister_circus"],
      sortIndex: 5,
    },
    "/monsters/butterjerry": {
      en: "Butterjerry",
      zone: "",
      dungeon: ["/actions/combat/chimerical_den"],
      sortIndex: -1,
    },
    "/monsters/centaur_archer": {
      en: "Centaur Archer",
      zone: "/actions/combat/jungle_planet",
      dungeon: ["/actions/combat/chimerical_den"],
      sortIndex: 4,
    },
    "/monsters/chronofrost_sorcerer": {
      en: "Chronofrost Sorcerer",
      zone: "/actions/combat/sorcerers_tower",
      sortIndex: 7,
    },
    "/monsters/crystal_colossus": {
      en: "Crystal Colossus",
      zone: "/actions/combat/golem_cave",
      sortIndex: 9,
    },
    "/monsters/demonic_overlord": {
      en: "Demonic Overlord",
      zone: "/actions/combat/infernal_abyss",
      sortIndex: 11,
    },
    "/monsters/dusk_revenant": {
      en: "Dusk Revenant",
      zone: "/actions/combat/twilight_zone",
      sortIndex: 10,
    },
    "/monsters/elementalist": {
      en: "Elementalist",
      zone: "/actions/combat/sorcerers_tower",
      dungeon: ["/actions/combat/sinister_circus"],
      sortIndex: 7,
    },
    "/monsters/enchanted_pawn": {
      en: "Enchanted Pawn",
      zone: "",
      dungeon: ["/actions/combat/enchanted_fortress"],
      sortIndex: -1,
    },
    "/monsters/eye": {
      en: "Eye",
      zone: "/actions/combat/planet_of_the_eyes",
      dungeon: ["/actions/combat/enchanted_fortress"],
      sortIndex: 6,
    },
    "/monsters/eyes": {
      en: "Eyes",
      zone: "/actions/combat/planet_of_the_eyes",
      dungeon: ["/actions/combat/enchanted_fortress"],
      sortIndex: 6,
    },
    "/monsters/flame_sorcerer": {
      en: "Flame Sorcerer",
      zone: "/actions/combat/sorcerers_tower",
      dungeon: [
        "/actions/combat/enchanted_fortress",
        "/actions/combat/sinister_circus",
      ],
      sortIndex: 7,
    },
    "/monsters/fly": {
      en: "Fly",
      zone: "/actions/combat/smelly_planet",
      sortIndex: 1,
    },
    "/monsters/frog": {
      en: "Frogger",
      zone: "/actions/combat/swamp_planet",
      dungeon: ["/actions/combat/chimerical_den"],
      sortIndex: 2,
    },
    "/monsters/sea_snail": {
      en: "Gary",
      zone: "/actions/combat/aqua_planet",
      sortIndex: 3,
    },
    "/monsters/giant_shoebill": {
      en: "Giant Shoebill",
      zone: "/actions/combat/swamp_planet",
      sortIndex: 2,
    },
    "/monsters/gobo_chieftain": {
      en: "Gobo Chieftain",
      zone: "/actions/combat/gobo_planet",
      sortIndex: 5,
    },
    "/monsters/granite_golem": {
      en: "Granite Golem",
      zone: "/actions/combat/golem_cave",
      sortIndex: 9,
    },
    "/monsters/grizzly_bear": {
      en: "Grizzly Bear",
      zone: "/actions/combat/bear_with_it",
      dungeon: ["/actions/combat/sinister_circus"],
      sortIndex: 8,
    },
    "/monsters/gummy_bear": {
      en: "Gummy Bear",
      zone: "/actions/combat/bear_with_it",
      dungeon: [
        "/actions/combat/chimerical_den",
        "/actions/combat/sinister_circus",
      ],
      sortIndex: 8,
    },
    "/monsters/crab": {
      en: "I Pinch",
      zone: "/actions/combat/aqua_planet",
      sortIndex: 3,
    },
    "/monsters/ice_sorcerer": {
      en: "Ice Sorcerer",
      zone: "/actions/combat/sorcerers_tower",
      dungeon: [
        "/actions/combat/enchanted_fortress",
        "/actions/combat/sinister_circus",
      ],
      sortIndex: 7,
    },
    "/monsters/infernal_warlock": {
      en: "Infernal Warlock",
      zone: "/actions/combat/infernal_abyss",
      sortIndex: 11,
    },
    "/monsters/jackalope": {
      en: "Jackalope",
      zone: "",
      dungeon: ["/actions/combat/chimerical_den"],
      sortIndex: -1,
    },
    "/monsters/rat": {
      en: "Jerry",
      zone: "/actions/combat/smelly_planet",
      dungeon: ["/actions/combat/chimerical_den"],
      sortIndex: 1,
    },
    "/monsters/jungle_sprite": {
      en: "Jungle Sprite",
      zone: "/actions/combat/jungle_planet",
      dungeon: ["/actions/combat/chimerical_den"],
      sortIndex: 4,
    },
    "/monsters/luna_empress": {
      en: "Luna Empress",
      zone: "/actions/combat/jungle_planet",
      sortIndex: 4,
    },
    "/monsters/magnetic_golem": {
      en: "Magnetic Golem",
      zone: "/actions/combat/golem_cave",
      dungeon: ["/actions/combat/enchanted_fortress"],
      sortIndex: 9,
    },
    "/monsters/marine_huntress": {
      en: "Marine Huntress",
      zone: "/actions/combat/aqua_planet",
      sortIndex: 3,
    },
    "/monsters/myconid": {
      en: "Myconid",
      zone: "/actions/combat/jungle_planet",
      sortIndex: 4,
    },
    "/monsters/nom_nom": {
      en: "Nom Nom",
      zone: "/actions/combat/aqua_planet",
      sortIndex: 3,
    },
    "/monsters/novice_sorcerer": {
      en: "Novice Sorcerer",
      zone: "/actions/combat/sorcerers_tower",
      dungeon: [
        "/actions/combat/enchanted_fortress",
        "/actions/combat/sinister_circus",
      ],
      sortIndex: 7,
    },
    "/monsters/panda": {
      en: "Panda",
      zone: "/actions/combat/bear_with_it",
      dungeon: ["/actions/combat/sinister_circus"],
      sortIndex: 8,
    },
    "/monsters/polar_bear": {
      en: "Polar Bear",
      zone: "/actions/combat/bear_with_it",
      dungeon: ["/actions/combat/sinister_circus"],
      sortIndex: 8,
    },
    "/monsters/porcupine": {
      en: "Porcupine",
      zone: "/actions/combat/smelly_planet",
      dungeon: ["/actions/combat/chimerical_den"],
      sortIndex: 1,
    },
    "/monsters/rabid_rabbit": {
      en: "Rabid Rabbit",
      zone: "",
      dungeon: ["/actions/combat/sinister_circus"],
      sortIndex: -1,
    },
    "/monsters/red_panda": {
      en: "Red Panda",
      zone: "/actions/combat/bear_with_it",
      sortIndex: 8,
    },
    "/monsters/alligator": {
      en: "Sherlock",
      zone: "/actions/combat/swamp_planet",
      sortIndex: 2,
    },
    "/monsters/gobo_shooty": {
      en: "Shooty",
      zone: "/actions/combat/gobo_planet",
      dungeon: ["/actions/combat/sinister_circus"],
      sortIndex: 5,
    },
    "/monsters/skunk": {
      en: "Skunk",
      zone: "/actions/combat/smelly_planet",
      sortIndex: 1,
    },
    "/monsters/gobo_slashy": {
      en: "Slashy",
      zone: "/actions/combat/gobo_planet",
      dungeon: ["/actions/combat/sinister_circus"],
      sortIndex: 5,
    },
    "/monsters/slimy": {
      en: "Slimy",
      zone: "/actions/combat/smelly_planet",
      sortIndex: 1,
    },
    "/monsters/gobo_smashy": {
      en: "Smashy",
      zone: "/actions/combat/gobo_planet",
      dungeon: ["/actions/combat/sinister_circus"],
      sortIndex: 5,
    },
    "/monsters/soul_hunter": {
      en: "Soul Hunter",
      zone: "/actions/combat/infernal_abyss",
      dungeon: ["/actions/combat/enchanted_fortress"],
      sortIndex: 11,
    },
    "/monsters/gobo_stabby": {
      en: "Stabby",
      zone: "/actions/combat/gobo_planet",
      dungeon: ["/actions/combat/sinister_circus"],
      sortIndex: 5,
    },
    "/monsters/stalactite_golem": {
      en: "Stalactite Golem",
      zone: "/actions/combat/golem_cave",
      dungeon: ["/actions/combat/enchanted_fortress"],
      sortIndex: 9,
    },
    "/monsters/swampy": {
      en: "Swampy",
      zone: "/actions/combat/swamp_planet",
      dungeon: ["/actions/combat/chimerical_den"],
      sortIndex: 2,
    },
    "/monsters/the_watcher": {
      en: "The Watcher",
      zone: "/actions/combat/planet_of_the_eyes",
      sortIndex: 6,
    },
    "/monsters/snake": {
      en: "Thnake",
      zone: "/actions/combat/swamp_planet",
      sortIndex: 2,
    },
    "/monsters/treant": {
      en: "Treant",
      zone: "/actions/combat/jungle_planet",
      sortIndex: 4,
    },
    "/monsters/turtle": {
      en: "Turuto",
      zone: "/actions/combat/aqua_planet",
      sortIndex: 3,
    },
    "/monsters/vampire": {
      en: "Vampire",
      zone: "/actions/combat/twilight_zone",
      dungeon: ["/actions/combat/sinister_circus"],
      sortIndex: 10,
    },
    "/monsters/veyes": {
      en: "Veyes",
      zone: "/actions/combat/planet_of_the_eyes",
      dungeon: ["/actions/combat/enchanted_fortress"],
      sortIndex: 6,
    },
    "/monsters/werewolf": {
      en: "Werewolf",
      zone: "/actions/combat/twilight_zone",
      dungeon: ["/actions/combat/sinister_circus"],
      sortIndex: 10,
    },
    "/monsters/zombie": {
      en: "Zombie",
      zone: "/actions/combat/twilight_zone",
      dungeon: ["/actions/combat/sinister_circus"],
      sortIndex: 10,
    },
    "/monsters/zombie_bear": {
      en: "Zombie Bear",
      zone: "",
      dungeon: ["/actions/combat/sinister_circus"],
      sortIndex: -1,
    },
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

    const fullTaskName = Array.from(div.childNodes)
      .find((node) => node.nodeType === Node.TEXT_NODE)
      .textContent.trim();
    return getTaskDetailFromTaskName(fullTaskName);
  }

  function getTaskTokenCount(taskElement) {
    // Find the reward that is Task Token
    const rewardItems = taskElement.querySelectorAll(".Item_item__2De2O");
    for (const item of rewardItems) {
      const icon = item.querySelector("use");
      if (
        icon &&
        icon.getAttribute("href") &&
        icon.getAttribute("href").includes("task_token")
      ) {
        const tokenDiv = item.querySelector(".Item_count__1HVvv");
        if (tokenDiv) {
          const tokenText = tokenDiv.textContent.trim();
          return parseInt(tokenText.replace(/[^0-9]/g, ""), 10) || 0;
        }
      }
    }
    return 0;
  }

  function getCurrentCoins() {
    // Try to find coins in the main UI - look for more specific patterns
    const coinElements = document.querySelectorAll('[class*="coin"], [class*="Coin"], [class*="money"], [class*="Money"], [class*="currency"], [class*="Currency"]');
    
    for (const element of coinElements) {
      const text = element.textContent || element.innerText || '';
      // Look for patterns like "160,000", "160k", "160K", "3,358,000", etc.
      const match = text.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(k|K|thousand|m|M|million)?/);
      if (match) {
        let amount = parseFloat(match[1].replace(/,/g, ''));
        const unit = match[2] ? match[2].toLowerCase() : '';
        if (unit === 'k' || unit === 'thousand') {
          amount *= 1000;
        } else if (unit === 'm' || unit === 'million') {
          amount *= 1000000;
        }
        console.log(`Auto-reroll: Found coin amount: ${amount} from text: "${text}"`);
        autoRerollState.lastKnownCoins = amount;
        autoRerollState.coinDetectionFailed = false;
        return amount;
      }
    }
    
    // Try to find in top bar or header area
    const headerElements = document.querySelectorAll('header, [class*="header"], [class*="top"], [class*="bar"], [class*="nav"]');
    for (const header of headerElements) {
      const text = header.textContent || header.innerText || '';
      const match = text.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(k|K|thousand|m|M|million)?/);
      if (match) {
        let amount = parseFloat(match[1].replace(/,/g, ''));
        const unit = match[2] ? match[2].toLowerCase() : '';
        if (unit === 'k' || unit === 'thousand') {
          amount *= 1000;
        } else if (unit === 'm' || unit === 'million') {
          amount *= 1000000;
        }
        console.log(`Auto-reroll: Found coin amount in header: ${amount} from text: "${text}"`);
        autoRerollState.lastKnownCoins = amount;
        autoRerollState.coinDetectionFailed = false;
        return amount;
      }
    }
    
    // Try to find in any element that might contain coin information
    const allElements = document.querySelectorAll('*');
    for (const element of allElements) {
      const text = element.textContent || element.innerText || '';
      // Look for large numbers that could be coins (3+ digits with commas)
      const match = text.match(/(\d{3,}(?:,\d{3})*(?:\.\d+)?)\s*(k|K|thousand|m|M|million)?/);
      if (match) {
        let amount = parseFloat(match[1].replace(/,/g, ''));
        const unit = match[2] ? match[2].toLowerCase() : '';
        if (unit === 'k' || unit === 'thousand') {
          amount *= 1000;
        } else if (unit === 'm' || unit === 'million') {
          amount *= 1000000;
        }
        // Only return if it's a reasonable coin amount (not too small)
        if (amount >= 1000) {
          console.log(`Auto-reroll: Found coin amount: ${amount} from text: "${text}"`);
          autoRerollState.lastKnownCoins = amount;
          autoRerollState.coinDetectionFailed = false;
          return amount;
        }
      }
    }
    
    // If we can't find coins, use cached value or disable coin checking
    if (autoRerollState.lastKnownCoins > 0) {
      console.log(`Auto-reroll: Using cached coin amount: ${autoRerollState.lastKnownCoins}`);
      return autoRerollState.lastKnownCoins;
    }
    
    // If this is the first time and we can't find coins, disable coin checking
    if (!autoRerollState.coinDetectionFailed) {
      console.log('Auto-reroll: Could not detect coin amount - disabling coin threshold checking');
      autoRerollState.coinDetectionFailed = true;
    }
    
    return 0;
  }

  // Auto-reroll functionality
  let autoRerollState = {
    isRunning: false,
    rerollQueue: new Set(), // Track tasks being rerolled
    rerollAttempts: new Map(), // Track reroll attempts per task
    timeoutId: null, // Track timeout for clearing
    lastKnownCoins: 0, // Cache last known coin amount
    coinDetectionFailed: false, // Flag to track if coin detection is failing
    isStopped: false, // Flag to completely stop auto-reroll
  };

  function stopAutoReroll() {
    console.log('Auto-reroll: Stopping all auto-reroll processes');
    autoRerollState.isRunning = false;
    autoRerollState.isStopped = true;
    autoRerollState.rerollAttempts.clear();
    autoRerollState.rerollQueue.clear();
    
    // Clear any pending timeouts
    if (autoRerollState.timeoutId) {
      clearTimeout(autoRerollState.timeoutId);
      autoRerollState.timeoutId = null;
    }
    
    // Force stop any running processes
    console.log('Auto-reroll: All processes stopped');
  }

  function findRerollButton(taskElement) {
    // Look for reroll button in the task element
    const rerollButton = taskElement.querySelector('button[title*="reroll"], button[title*="Reroll"]');
    if (rerollButton) return rerollButton;
    
    // Alternative: look for button with reroll icon or text
    const buttons = taskElement.querySelectorAll('button');
    for (const button of buttons) {
      const text = button.textContent.toLowerCase();
      const title = button.getAttribute('title')?.toLowerCase() || '';
      if (text.includes('reroll') || title.includes('reroll')) {
        return button;
      }
    }
    
    return null;
  }

  function generateTaskId(taskElement) {
    // Generate a unique ID for the task based on its position and content
    const taskName = taskElement.querySelector('.RandomTask_name__1hl1b')?.textContent || '';
    const taskType = taskElement.querySelector('.RandomTask_name__1hl1b')?.textContent?.split(' - ')[0] || '';
    return `${taskType}_${taskName}_${Array.from(taskElement.parentNode.children).indexOf(taskElement)}`;
  }

  async function performAutoReroll(taskElement) {
    if (!globalConfig.autoReroll.enabled) return false;
    
    const taskId = generateTaskId(taskElement);
    const currentTokenCount = getTaskTokenCount(taskElement);
    
    // Get task details for detailed logging
    const taskName = taskElement.querySelector('.RandomTask_name__1hl1b')?.textContent?.trim() || 'Unknown Task';
    const progressText = taskElement.querySelector('.RandomTask_taskInfo__1uasf > div:not(.RandomTask_action__3eC6o)')?.textContent?.trim() || 'Unknown Progress';
    
    console.log(`Auto-reroll: Processing task "${taskName}" - ${progressText} - Tokens: ${currentTokenCount}`);
    
    // Check if task meets reroll criteria
    if (currentTokenCount >= globalConfig.autoReroll.minTokenThreshold) {
      console.log(`Auto-reroll: Skipping "${taskName}" - already has enough tokens (${currentTokenCount} >= ${globalConfig.autoReroll.minTokenThreshold})`);
      return false; // Task already has sufficient tokens
    }

    // Check if we have enough coins to continue rerolling
    const currentCoins = getCurrentCoins();
    if (!autoRerollState.coinDetectionFailed && currentCoins > 0 && currentCoins < globalConfig.autoReroll.maxCoinThreshold) {
      console.log(`Auto-reroll: Stopping reroll - not enough coins (${currentCoins} < ${globalConfig.autoReroll.maxCoinThreshold})`);
      return false;
    }

    // Check if reroll options are already visible
    const rerollOptionsContainer = taskElement.querySelector('.RandomTask_rerollOptionsContainer__3yFjo');
    
    if (!rerollOptionsContainer) {
      // Reroll options not visible, need to click the initial reroll button
      console.log(`Auto-reroll: Reroll options not visible for "${taskName}", looking for initial reroll button`);
      const buttonGroup = taskElement.querySelector('.RandomTask_buttonGroup__2gFGO');
      if (!buttonGroup) {
        console.log(`Auto-reroll: No button group found for "${taskName}"`);
        return false;
      }
      
      // Find the reroll button (not the remove button)
      const buttons = buttonGroup.querySelectorAll('button.Button_fullWidth__17pVU');
      let initialRerollButton = null;
      
      for (const button of buttons) {
        const text = button.textContent.trim();
        if (text === 'Reroll') {
          initialRerollButton = button;
          break;
        }
      }
      
      if (!initialRerollButton) {
        console.log(`Auto-reroll: No reroll button found for "${taskName}"`);
        return false;
      }
      
      console.log(`Auto-reroll: Clicking initial reroll button for "${taskName}"`);
      initialRerollButton.click();

      // Wait for options to appear
      await new Promise(resolve => setTimeout(resolve, 500));
    } else {
      console.log(`Auto-reroll: Reroll options already visible for "${taskName}"`);
    }

    // Chọn tùy chọn reroll có chi phí coin thấp nhất
    const rerollButtons = rerollOptionsContainer ? 
      rerollOptionsContainer.querySelectorAll('button') : 
      taskElement.querySelectorAll('.RandomTask_rerollOptionsContainer__3yFjo button');
    let selectedButton = null;
    let minCost = Infinity;
    
    console.log(`Auto-reroll: Found ${rerollButtons.length} reroll buttons for "${taskName}"`);
    rerollButtons.forEach((button, index) => {
      const text = button.textContent || button.innerText || '';
      console.log(`Auto-reroll: Button ${index} for "${taskName}": "${text}"`);
      
      // Debug: Check what icons are in this button
      const allIcons = button.querySelectorAll('svg use');
      allIcons.forEach((icon, iconIndex) => {
        const href = icon.getAttribute('href');
        console.log(`Auto-reroll: Button ${index} icon ${iconIndex}: href="${href}"`);
      });
      
      // Tìm nút có icon coin (SVG với href chứa "#coin")
      const coinIcon = button.querySelector('svg use[href*="#coin"]');
      if (coinIcon) {
        console.log(`Auto-reroll: Found coin button for "${taskName}": "${text}"`);
        // Trích xuất số tiền từ text (ví dụ: "Pay 20000" -> 20000, "Pay 160K" -> 160000)
        const match = text.match(/Pay\s+(\d+(?:,\d{3})*)\s*(K|M)?/i);
        if (match) {
          let cost = parseInt(match[1].replace(/,/g, ''), 10);
          const unit = match[2];
          if (unit) {
            const unitChar = unit.toUpperCase();
            if (unitChar === 'K') cost *= 1000;
            else if (unitChar === 'M') cost *= 1000000;
          }
          console.log(`Auto-reroll: Parsed cost for "${taskName}": ${cost}, maxThreshold: ${globalConfig.autoReroll.maxCoinThreshold}`);
          if (cost < minCost && cost < globalConfig.autoReroll.maxCoinThreshold) {
            minCost = cost;
            selectedButton = button;
            console.log(`Auto-reroll: Selected button for "${taskName}" with cost: ${cost}`);
          }
        } else {
          console.log(`Auto-reroll: No match found for "${taskName}" text: "${text}"`);
        }
      } else {
        console.log(`Auto-reroll: Button ${index} for "${taskName}" has no coin icon`);
      }
    });

    if (!selectedButton) {
      console.log(`Auto-reroll: No suitable reroll option found using coins for "${taskName}"`);
      return false;
    }

    // Click vào nút reroll đã chọn với behavior giống người thật
    console.log(`Auto-reroll: Clicking selected button for "${taskName}" with cost: ${minCost}`);
    
    // Add small random delay before clicking (human-like behavior)
    const clickDelay = 100 + Math.random() * 200; // 100-300ms
    await new Promise(resolve => setTimeout(resolve, clickDelay));
    
    // Simulate mouse hover before click
    selectedButton.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
    
    // Click the button
    selectedButton.click();
    
    // Small delay after click
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));

    // Wait for the reroll to complete with random delay
    const baseDelay = globalConfig.autoReroll.delayBetweenRerolls;
    const randomVariation = 0.2 + Math.random() * 0.3; // 20-50% random variation
    const randomDelay = baseDelay + Math.random() * (baseDelay * randomVariation);
    const finalDelay = Math.floor(randomDelay);
    console.log(`Auto-reroll: Waiting ${finalDelay}ms for reroll to complete (base: ${baseDelay}ms)`);
    await new Promise(resolve => setTimeout(resolve, finalDelay));

    console.log(`Auto-reroll: Successfully rerolled "${taskName}"`);
    return true;
  }

  async function processAutoReroll() {
    // Check if auto-reroll is disabled or stopped
    if (!globalConfig.autoReroll.enabled) {
      console.log('Auto-reroll: Skipping - disabled by config');
      return;
    }
    
    if (autoRerollState.isStopped) {
      console.log('Auto-reroll: Skipping - stopped by user');
      return;
    }
    
    if (autoRerollState.isRunning) {
      console.log('Auto-reroll: Skipping - already running');
      return;
    }
    
    autoRerollState.isRunning = true;
    
    try {
      const taskElements = document.querySelectorAll('div.RandomTask_randomTask__3B9fA');
    const tasksToReroll = [];
    
    // Find tasks that need rerolling
    for (const taskElement of taskElements) {
      const tokenCount = getTaskTokenCount(taskElement);
      const taskName = taskElement.querySelector('.RandomTask_name__1hl1b')?.textContent?.trim() || 'Unknown Task';
      console.log(`Auto-reroll: Task "${taskName}" has ${tokenCount} tokens (threshold: ${globalConfig.autoReroll.minTokenThreshold})`);
      if (tokenCount < globalConfig.autoReroll.minTokenThreshold) {
        tasksToReroll.push(taskElement);
        console.log(`Auto-reroll: Added "${taskName}" to reroll list`);
      }
    }
    
    if (tasksToReroll.length === 0) {
      console.log('Auto-reroll: No tasks need rerolling');
      autoRerollState.isRunning = false;
      return;
    }
    
    console.log(`Auto-reroll: Found ${tasksToReroll.length} tasks to reroll - processing one by one until completion`);
    
    // Process tasks one by one until each is complete
    let skippedTasksCount = 0;
    
    for (let i = 0; i < tasksToReroll.length; i++) {
      // Check if auto-reroll has been stopped before processing each task
      if (!globalConfig.autoReroll.enabled || autoRerollState.isStopped) {
        console.log('Auto-reroll: Stopped before processing task - exiting loop');
        autoRerollState.isRunning = false;
        return;
      }
      
      const taskElement = tasksToReroll[i];
      const taskName = taskElement.querySelector('.RandomTask_name__1hl1b')?.textContent?.trim() || 'Unknown Task';
      
      console.log(`Auto-reroll: Starting task ${i + 1}/${tasksToReroll.length}: "${taskName}"`);
      
      // Keep rerolling this task until it meets criteria
      let rerollCount = 0;
      const maxRerollsPerTask = 50; // Prevent infinite loops
      
      while (rerollCount < maxRerollsPerTask) {
        // Check if auto-reroll has been stopped
        if (autoRerollState.isStopped) {
          console.log('Auto-reroll: Stopped by user');
          autoRerollState.isRunning = false;
          return;
        }
        
        if (!globalConfig.autoReroll.enabled) {
          console.log('Auto-reroll: Disabled by user');
          autoRerollState.isRunning = false;
          return;
        }
        
        // Check if we have enough coins to continue rerolling
        const currentCoins = getCurrentCoins();
        if (!autoRerollState.coinDetectionFailed && currentCoins > 0 && currentCoins < globalConfig.autoReroll.maxCoinThreshold) {
          console.log(`Auto-reroll: Stopping all rerolls - not enough coins (${currentCoins} < ${globalConfig.autoReroll.maxCoinThreshold})`);
          autoRerollState.isRunning = false;
          return;
        }
        
        // Check if any reroll option costs more than threshold for this specific task
        const rerollOptionsContainer = taskElement.querySelector('.RandomTask_rerollOptionsContainer__3yFjo');
        if (rerollOptionsContainer) {
          const rerollButtons = rerollOptionsContainer.querySelectorAll('button');
          let hasExpensiveOption = false;
          for (const button of rerollButtons) {
            const text = button.textContent || button.innerText || '';
            const coinIcon = button.querySelector('svg use[href*="#coin"]');
            if (coinIcon) {
              const match = text.match(/Pay\s+(\d+(?:,\d{3})*)\s*(K|M)?/i);
              if (match) {
                let cost = parseInt(match[1].replace(/,/g, ''), 10);
                const unit = match[2];
                if (unit) {
                  const unitChar = unit.toUpperCase();
                  if (unitChar === 'K') cost *= 1000;
                  else if (unitChar === 'M') cost *= 1000000;
                }
                if (cost >= globalConfig.autoReroll.maxCoinThreshold) {
                  hasExpensiveOption = true;
                  break;
                }
              }
            }
          }
          if (hasExpensiveOption) {
            console.log(`Auto-reroll: Skipping task "${taskName}" - found expensive option (>= ${globalConfig.autoReroll.maxCoinThreshold})`);
            skippedTasksCount++;
            break; // Move to next task instead of stopping everything
          }
        }
        
        // Reset skipped count when we find a task we can process
        skippedTasksCount = 0;
        
        // Check current token count
        const currentTokenCount = getTaskTokenCount(taskElement);
        if (currentTokenCount >= globalConfig.autoReroll.minTokenThreshold) {
          console.log(`Auto-reroll: Task "${taskName}" completed! Final tokens: ${currentTokenCount} (after ${rerollCount} rerolls)`);
          break; // Move to next task
        }
        
        // Try to reroll this task
        try {
          const rerollSuccess = await performAutoReroll(taskElement);
          rerollCount++;
          
          if (!rerollSuccess) {
            console.log(`Auto-reroll: Cannot reroll task "${taskName}" anymore (no suitable options or cost too high)`);
            break; // Move to next task
          }
          
          console.log(`Auto-reroll: Task "${taskName}" rerolled ${rerollCount} times, current tokens: ${getTaskTokenCount(taskElement)}`);
          
          // Wait between rerolls with random delay to avoid detection
          const baseDelay = globalConfig.autoReroll.delayBetweenRerolls;
          const randomVariation = 0.3 + Math.random() * 0.4; // 30-70% random variation
          const randomDelay = baseDelay + Math.random() * (baseDelay * randomVariation);
          const finalDelay = Math.floor(randomDelay);
          console.log(`Auto-reroll: Waiting ${finalDelay}ms before next reroll (base: ${baseDelay}ms, variation: ${Math.round(randomVariation * 100)}%)`);
          
          // Occasionally add a longer pause to simulate human behavior (5% chance)
          if (Math.random() < 0.05) {
            const extraPause = 2000 + Math.random() * 3000; // 2-5 seconds
            console.log(`Auto-reroll: Adding extra pause of ${Math.floor(extraPause)}ms (human-like behavior)`);
            await new Promise(resolve => setTimeout(resolve, extraPause));
          }
          
          await new Promise(resolve => setTimeout(resolve, finalDelay));
          
        } catch (error) {
          console.error(`Auto-reroll: Error rerolling task "${taskName}":`, error);
          console.error('Auto-reroll: Stopping auto-reroll due to error');
          autoRerollState.isRunning = false;
          return; // Stop the entire process on error
        }
      }
      
      if (rerollCount >= maxRerollsPerTask) {
        console.log(`Auto-reroll: Task "${taskName}" reached max rerolls (${maxRerollsPerTask}), moving to next task`);
      }
      
              // Wait between different tasks with random delay
        if (i < tasksToReroll.length - 1) {
          const baseDelay = globalConfig.autoReroll.delayBetweenRerolls;
          const randomDelay = baseDelay + Math.random() * (baseDelay * 0.3); // Add 0-30% random variation for task switching
          const finalDelay = Math.floor(randomDelay);
          console.log(`Auto-reroll: Waiting ${finalDelay}ms before next task (base: ${baseDelay}ms)`);
          await new Promise(resolve => setTimeout(resolve, finalDelay));
        }
    }
    
    // Check if all tasks were skipped due to high cost
    if (skippedTasksCount === tasksToReroll.length) {
      console.log('Auto-reroll: All tasks were skipped due to high cost - stopping auto-reroll');
      autoRerollState.isRunning = false;
      return;
    }
    
    console.log('Auto-reroll: Completed all tasks');
    autoRerollState.isRunning = false;
    
    } catch (error) {
      console.error('Auto-reroll: Critical error in auto-reroll process:', error);
      console.error('Auto-reroll: Stopping auto-reroll due to critical error');
      autoRerollState.isRunning = false;
    }
    
    // Re-check after a delay only if there are tasks that need rerolling
    autoRerollState.timeoutId = setTimeout(() => {
      if (globalConfig.autoReroll.enabled) {
        // Check if there are any tasks that still need rerolling
        const taskElements = document.querySelectorAll('div.RandomTask_randomTask__3B9fA');
        const tasksToReroll = [];
        
        taskElements.forEach(taskElement => {
          const tokenCount = getTaskTokenCount(taskElement);
          if (tokenCount < globalConfig.autoReroll.minTokenThreshold) {
            tasksToReroll.push(taskElement);
          }
        });
        
        // Only continue if there are tasks that need rerolling
        if (tasksToReroll.length > 0) {
          console.log(`Auto-reroll: Re-checking - found ${tasksToReroll.length} tasks still need rerolling`);
          processAutoReroll();
        } else {
          console.log('Auto-reroll: All tasks meet token threshold - stopping auto-reroll');
          autoRerollState.isRunning = false;
        }
      }
      autoRerollState.timeoutId = null;
    }, globalConfig.autoReroll.delayBetweenRerolls * 2);
  }

  // Update compareFn to use only custom order
  function compareFn(a, b) {
    const a_TaskTokenCount = getTaskTokenCount(a);
    const b_TaskTokenCount = getTaskTokenCount(b);
    // Sort by ascending/descending option
    if (a_TaskTokenCount !== b_TaskTokenCount) {
      if (globalConfig.isTaskTokenAsc) {
        return a_TaskTokenCount - b_TaskTokenCount; // ascending
      } else {
        return b_TaskTokenCount - a_TaskTokenCount; // descending
      }
    }
    // ...existing code...
    var { taskType: a_TypeIndex, taskName: a_taskName } =
      getTaskDetailFromElement(a);
    var { taskType: b_TypeIndex, taskName: b_TaskName } =
      getTaskDetailFromElement(b);
    const a_TypeName = Object.keys(taskOrderIndex).find(
      (key) => taskOrderIndex[key] === a_TypeIndex
    );
    const b_TypeName = Object.keys(taskOrderIndex).find(
      (key) => taskOrderIndex[key] === b_TypeIndex
    );
    const a_Order =
      globalConfig.customTaskOrder[a_TypeName] || taskOrderIndex[a_TypeName];
    const b_Order =
      globalConfig.customTaskOrder[b_TypeName] || taskOrderIndex[b_TypeName];
    if (a_Order !== b_Order) {
      return a_Order - b_Order;
    }
    if (a_TypeIndex === taskBattleIndex && b_TypeIndex === taskBattleIndex) {
      var a_MapIndex = getMapIndexFromMonsterName(a_taskName);
      var b_MapIndex = getMapIndexFromMonsterName(b_TaskName);
      if (a_MapIndex != b_MapIndex) {
        return a_MapIndex > b_MapIndex ? 1 : -1;
      }
    }
    if (a_TypeIndex == b_TypeIndex) {
      return a_taskName == b_TaskName ? 0 : a_taskName > b_TaskName ? 1 : -1;
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
    const isShowDungeon =
      Object.values(globalConfig.dungeonConfig).filter(Boolean).length > 0;
    if (!isShowDungeon) {
      offset = 50;
    }

    const backgroundDiv = document.createElement("div");
    backgroundDiv.id = "MonsterIcon";
    backgroundDiv.style.position = "absolute";
    backgroundDiv.style.left = `${offset}%`;
    offset += 30;
    backgroundDiv.style.width = "30%";
    backgroundDiv.style.height = "100%";
    backgroundDiv.style.opacity = "0.3";

    const monsterName = monsterHrid.split("/").pop();
    const svgContent = `<svg width="100%" height="100%"><use href="/static/media/combat_monsters_sprite.395438a8.svg#${monsterName}"></use></svg>`;
    backgroundDiv.innerHTML = svgContent;

    div.appendChild(backgroundDiv);

    const dungeonMap = allMonster[monsterHrid]?.dungeon;
    if (isShowDungeon && dungeonMap) {
      Object.keys(globalConfig.dungeonConfig)
        .filter((dungeon) => globalConfig.dungeonConfig[dungeon])
        .forEach((dungeon) => {
          if (dungeonMap.includes(dungeon)) {
            const dungeonDiv = document.createElement("div");
            dungeonDiv.id = "DungeonIcon";
            dungeonDiv.style.position = "absolute";
            dungeonDiv.style.left = `${offset}%`;
            offset += 30;
            dungeonDiv.style.width = "30%";
            dungeonDiv.style.height = "100%";
            dungeonDiv.style.opacity = "0.3";

            const dungeonName = dungeon.split("/").pop();
            const svgContent = `<svg width="100%" height="100%"><use href="/static/media/actions_sprite.8d5ceb4a.svg#${dungeonName}"></use></svg>`;
            dungeonDiv.innerHTML = svgContent;

            div.appendChild(dungeonDiv);
          }
        });
    }

    // Fix button style
    div.style.position = "relative";
    div.querySelector(".RandomTask_content__VVQva").style.zIndex = 1;
    div
      .querySelectorAll(".Item_item__2De2O")
      .forEach((node) => (node.style.backgroundColor = "transparent"));
  }

  function updateIconByConfig() {
    const battleIcon = document.querySelector("#BattleIcon");
    if (battleIcon) {
      if (globalConfig.isBattleIcon) {
        battleIcon.style.opacity = "1";
        battleIcon.querySelector("#taskCount").style.display = "inline";
      } else {
        battleIcon.style.opacity = "0.3";
        battleIcon.querySelector("#taskCount").style.display = "none";
      }
    }

    Object.keys(globalConfig.dungeonConfig).forEach((dungeon) => {
      const dungeonIcon = document.querySelector(
        `#${dungeon.split("/").pop()}`
      );
      if (dungeonIcon) {
        if (globalConfig.isBattleIcon && globalConfig.dungeonConfig[dungeon]) {
          dungeonIcon.style.opacity = "1";
          dungeonIcon.querySelector("#taskCount").style.display = "inline";
        } else {
          dungeonIcon.style.opacity = "0.3";
          dungeonIcon.querySelector("#taskCount").style.display = "none";
        }
      }
    });
  }

  function createIcon(id, href) {
    // battle icon
    const div = document.createElement("div");
    div.id = id;
    div.style.height = "100%"; // 设置高度

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Combat");
    svg.setAttribute(
      "class",
      "Icon_icon__2LtL_ Icon_xtiny__331pI Icon_inline__1Idwv"
    );
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
        let configkey = Object.keys(globalConfig.dungeonConfig).find(
          (key) => key.split("/").pop() === id
        );
        globalConfig.dungeonConfig[configkey] =
          !globalConfig.dungeonConfig[configkey];
      }
      saveConfig(); //auto save when click

      updateIconByConfig();

      //clean all checkers to refresh statics
      document
        .querySelectorAll("#taskChekerInCoin")
        .forEach((checker) => (checker.id = null));
    });

    return div;
  }

  // Function to generate a unique ID for each task based on its content
  function generateTaskId(taskElement) {
    const { taskType, taskName } = getTaskDetailFromElement(taskElement);
    return `${taskType}_${taskName}`;
  }

  // Function to check if the task list has changed
  function hasTaskListChanged(taskElements) {
    if (taskElements.length !== sortState.lastTaskCount) {
      return true;
    }

    // Create a new list of IDs from the current tasks
    const currentIds = taskElements.map((task) => generateTaskId(task));

    // Compare with the old list
    if (sortState.lastTaskIds.length !== currentIds.length) {
      return true;
    }

    // Check if any task has changed
    for (let i = 0; i < currentIds.length; i++) {
      if (!sortState.lastTaskIds.includes(currentIds[i])) {
        return true;
      }
    }

    return false;
  }

  // Function to update the sorted state
  function updateSortState(isSorted, taskElements) {
    sortState.isSorted = isSorted;
    sortState.lastTaskCount = taskElements.length;
    sortState.lastTaskIds = taskElements.map((task) => generateTaskId(task));

    // Add sorted indicator to the container
    const taskContainer = document.querySelector(
      "div.TasksPanel_taskList__2xh4k"
    );
    if (taskContainer) {
      if (isSorted) {
        taskContainer.setAttribute("data-sorted", "true");
      } else {
        taskContainer.removeAttribute("data-sorted");
      }
    }
  }

  function applyCustomOrder() {
    // Get all current tasks
    const list = document.querySelector("div.TasksPanel_taskList__2xh4k");
    if (!list) return;

    const tasks = [
      ...list.querySelectorAll("div.RandomTask_randomTask__3B9fA"),
    ];
    if (tasks.length === 0) return;

    // Resort according to the new order
    tasks.sort(compareFn).forEach((node) => list.appendChild(node));

    // Update sorted state
    updateSortState(true, tasks);
  }

  // Update sortTasks to use applyCustomOrder
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
    sortButton.setAttribute(
      "class",
      "Button_button__1Fe9z Button_small__3fqC7"
    );
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

    autoSortCheckbox.addEventListener("change", function (evt) {
      globalConfig.isAutoSort = this.checked;
      saveConfig();
      if (globalConfig.isAutoSort) {
        sortTasks();
      }
    });

    const autoSortText = document.createTextNode("Auto");
    autoSortLabel.appendChild(autoSortCheckbox);
    autoSortLabel.appendChild(autoSortText);

    // Add checkbox for sorting Task Token ascending/descending
    const tokenSortLabel = document.createElement("label");
    tokenSortLabel.style.display = "flex";
    tokenSortLabel.style.alignItems = "center";
    tokenSortLabel.style.marginLeft = "5px";
    tokenSortLabel.style.cursor = "pointer";
    tokenSortLabel.title = "Sort Task Token Ascending";

    const tokenSortCheckbox = document.createElement("input");
    tokenSortCheckbox.type = "checkbox";
    tokenSortCheckbox.id = "TaskTokenSortAsc";
    tokenSortCheckbox.checked = globalConfig.isTaskTokenAsc;
    tokenSortCheckbox.style.margin = "0 3px 0 0";

    tokenSortCheckbox.addEventListener("change", function (evt) {
      globalConfig.isTaskTokenAsc = this.checked;
      saveConfig();
      sortTasks();
    });

    const tokenSortText = document.createTextNode("Token");
    tokenSortLabel.appendChild(tokenSortCheckbox);
    tokenSortLabel.appendChild(tokenSortText);

    // Add auto-reroll toggle
    const autoRerollLabel = document.createElement("label");
    autoRerollLabel.style.display = "flex";
    autoRerollLabel.style.alignItems = "center";
    autoRerollLabel.style.marginLeft = "5px";
    autoRerollLabel.style.cursor = "pointer";
    autoRerollLabel.title = "Auto-reroll tasks with low token rewards";

    const autoRerollCheckbox = document.createElement("input");
    autoRerollCheckbox.type = "checkbox";
    autoRerollCheckbox.id = "AutoRerollCheckbox";
    autoRerollCheckbox.checked = globalConfig.autoReroll.enabled;
    autoRerollCheckbox.style.margin = "0 3px 0 0";

    autoRerollCheckbox.addEventListener("change", function (evt) {
      globalConfig.autoReroll.enabled = this.checked;
      saveConfig();
      if (globalConfig.autoReroll.enabled) {
        // Reset reroll state when enabling
        autoRerollState.isStopped = false; // Reset stopped flag
        autoRerollState.rerollAttempts.clear();
        autoRerollState.rerollQueue.clear();
        autoRerollState.coinDetectionFailed = false; // Reset coin detection
        autoRerollState.lastKnownCoins = 0; // Reset cached coins
        processAutoReroll();
      } else {
        // Stop auto-reroll immediately when unchecked
        stopAutoReroll();
      }
    });

    const autoRerollText = document.createTextNode("Auto-Reroll");
    autoRerollLabel.appendChild(autoRerollCheckbox);
    autoRerollLabel.appendChild(autoRerollText);

    // Create auto-reroll settings button
    const rerollSettingsButton = document.createElement("button");
    rerollSettingsButton.setAttribute(
      "class",
      "Button_button__1Fe9z Button_small__3fqC7"
    );
    rerollSettingsButton.id = "RerollSettings";
    rerollSettingsButton.innerHTML = "Reroll Settings";
    rerollSettingsButton.style.marginLeft = "5px";
    rerollSettingsButton.addEventListener("click", function (evt) {
      showAutoRerollSettingsDialog();
    });

    // Create sort priority button
    const priorityButton = document.createElement("button");
    priorityButton.setAttribute(
      "class",
      "Button_button__1Fe9z Button_small__3fqC7"
    );
    priorityButton.id = "SortPriority";
    priorityButton.innerHTML = "Priority";
    priorityButton.style.marginLeft = "5px";
    priorityButton.addEventListener("click", function (evt) {
      showSortPriorityDialog();
    });

    sortButtonContainer.appendChild(sortButton);
    sortButtonContainer.appendChild(autoSortLabel);
    sortButtonContainer.appendChild(tokenSortLabel);
    sortButtonContainer.appendChild(autoRerollLabel);
    sortButtonContainer.appendChild(rerollSettingsButton);
    sortButtonContainer.appendChild(priorityButton);
    pannel.appendChild(sortButtonContainer);

    // Add statistics bar
    const battleIcon = createIcon(
      "BattleIcon",
      "/static/media/misc_sprite.426c5d78.svg#combat"
    );
    pannel.appendChild(battleIcon);

    // Add all dungeon icons
    Object.keys(globalConfig.dungeonConfig).forEach((dungeon) => {
      const dungeonIcon = createIcon(
        dungeon.split("/").pop(),
        `/static/media/actions_sprite.8d5ceb4a.svg#${dungeon.split("/").pop()}`
      );
      pannel.appendChild(dungeonIcon);
    });
  }

  function getBlockedSkills() {
    const blockedSkills = [];
    const blockedContainer = document.querySelector(
      ".TasksPanel_taskTypeBlocksContainer__3TWCB"
    );
    if (!blockedContainer) return blockedSkills;

    const blockedSlots = blockedContainer.querySelectorAll(
      ".TaskBlockSlot_taskBlockSlot__1WF3H:not(.TaskBlockSlot_empty__1z0oE)"
    );
    blockedSlots.forEach((slot) => {
      const useElement = slot.querySelector("use");
      if (useElement) {
        const href = useElement.getAttribute("href");
        // Map SVG href to task type
        if (href.includes("combat")) {
          blockedSkills.push("Combat");
        } else if (href.includes("tailoring")) {
          blockedSkills.push("Tailoring");
        } else if (href.includes("crafting")) {
          blockedSkills.push("Crafting");
        } else if (href.includes("cooking")) {
          blockedSkills.push("Cooking");
        } else if (href.includes("brewing")) {
          blockedSkills.push("Brewing");
        } else if (href.includes("milking")) {
          blockedSkills.push("Milking");
        } else if (href.includes("foraging")) {
          blockedSkills.push("Foraging");
        } else if (href.includes("woodcutting")) {
          blockedSkills.push("Woodcutting");
        } else if (href.includes("cheesesmithing")) {
          blockedSkills.push("Cheesesmithing");
        }
      }
    });
    return blockedSkills;
  }

  function showAutoRerollSettingsDialog() {
    // Remove existing dialog if any
    const existingDialog = document.querySelector("#autoRerollSettingsDialog");
    if (existingDialog) {
      existingDialog.remove();
      return;
    }

    // Create dialog container
    const dialog = document.createElement("div");
    dialog.id = "autoRerollSettingsDialog";
    dialog.style.position = "fixed";
    dialog.style.top = "50%";
    dialog.style.left = "50%";
    dialog.style.transform = "translate(-50%, -50%)";
    dialog.style.backgroundColor = "white";
    dialog.style.padding = "20px";
    dialog.style.borderRadius = "5px";
    dialog.style.boxShadow = "0 0 10px rgba(0,0,0,0.5)";
    dialog.style.zIndex = "1000";
    dialog.style.minWidth = "300px";

    // Create title
    const title = document.createElement("h3");
    title.textContent = "Auto-Reroll Settings";
    title.style.marginTop = "0";
    title.style.marginBottom = "15px";
    title.style.textAlign = "center";
    dialog.appendChild(title);

    // Minimum token threshold setting
    const thresholdContainer = document.createElement("div");
    thresholdContainer.style.marginBottom = "15px";

    const thresholdLabel = document.createElement("label");
    thresholdLabel.textContent = "Minimum Token Threshold:";
    thresholdLabel.style.display = "block";
    thresholdLabel.style.marginBottom = "5px";
    thresholdLabel.style.fontWeight = "bold";

    const thresholdInput = document.createElement("input");
    thresholdInput.type = "number";
    thresholdInput.min = "1";
    thresholdInput.max = "20";
    thresholdInput.value = globalConfig.autoReroll.minTokenThreshold;
    thresholdInput.style.width = "100%";
    thresholdInput.style.padding = "5px";
    thresholdInput.style.border = "1px solid #ccc";
    thresholdInput.style.borderRadius = "3px";

    thresholdContainer.appendChild(thresholdLabel);
    thresholdContainer.appendChild(thresholdInput);
    dialog.appendChild(thresholdContainer);

    // Maximum reroll attempts setting
    // const attemptsContainer = document.createElement("div");
    // attemptsContainer.style.marginBottom = "15px";

    // const attemptsLabel = document.createElement("label");
    // attemptsLabel.textContent = "Maximum Reroll Attempts:";
    // attemptsLabel.style.display = "block";
    // attemptsLabel.style.marginBottom = "5px";
    // attemptsLabel.style.fontWeight = "bold";

    // const attemptsInput = document.createElement("input");
    // attemptsInput.type = "number";
    // attemptsInput.min = "1";
    // attemptsInput.max = "50";
    // attemptsInput.value = globalConfig.autoReroll.maxRerollAttempts;
    // attemptsInput.style.width = "100%";
    // attemptsInput.style.padding = "5px";
    // attemptsInput.style.border = "1px solid #ccc";
    // attemptsInput.style.borderRadius = "3px";

    // attemptsContainer.appendChild(attemptsLabel);
    // attemptsContainer.appendChild(attemptsInput);
    // dialog.appendChild(attemptsContainer);

    // Delay between rerolls setting
    const delayContainer = document.createElement("div");
    delayContainer.style.marginBottom = "15px";

    const delayLabel = document.createElement("label");
    delayLabel.textContent = "Delay Between Rerolls (ms):";
    delayLabel.style.display = "block";
    delayLabel.style.marginBottom = "5px";
    delayLabel.style.fontWeight = "bold";

    const delayInput = document.createElement("input");
    delayInput.type = "number";
    delayInput.min = "500";
    delayInput.max = "5000";
    delayInput.step = "100";
    delayInput.value = globalConfig.autoReroll.delayBetweenRerolls;
    delayInput.style.width = "100%";
    delayInput.style.padding = "5px";
    delayInput.style.border = "1px solid #ccc";
    delayInput.style.borderRadius = "3px";

    delayContainer.appendChild(delayLabel);
    delayContainer.appendChild(delayInput);
    dialog.appendChild(delayContainer);

    // Maximum coin threshold setting
    const coinThresholdContainer = document.createElement("div");
    coinThresholdContainer.style.marginBottom = "15px";

    const coinThresholdLabel = document.createElement("label");
    coinThresholdLabel.textContent = "Stop Rerolling at Coins:";
    coinThresholdLabel.style.display = "block";
    coinThresholdLabel.style.marginBottom = "5px";
    coinThresholdLabel.style.fontWeight = "bold";

    const coinThresholdInput = document.createElement("input");
    coinThresholdInput.type = "number";
    coinThresholdInput.min = "1000";
    coinThresholdInput.max = "1000000";
    coinThresholdInput.step = "1000";
    coinThresholdInput.value = globalConfig.autoReroll.maxCoinThreshold;
    coinThresholdInput.style.width = "100%";
    coinThresholdInput.style.padding = "5px";
    coinThresholdInput.style.border = "1px solid #ccc";
    coinThresholdInput.style.borderRadius = "3px";

    coinThresholdContainer.appendChild(coinThresholdLabel);
    coinThresholdContainer.appendChild(coinThresholdInput);
    dialog.appendChild(coinThresholdContainer);

    // Save button
    const saveButton = document.createElement("button");
    saveButton.textContent = "Save Settings";
    saveButton.setAttribute(
      "class",
      "Button_button__1Fe9z Button_small__3fqC7"
    );
    saveButton.style.width = "100%";
    saveButton.style.marginTop = "10px";
    saveButton.addEventListener("click", function () {
      // Update configuration
      globalConfig.autoReroll.minTokenThreshold = parseInt(thresholdInput.value) || 7;
      globalConfig.autoReroll.delayBetweenRerolls = parseInt(delayInput.value) || 1000;
      globalConfig.autoReroll.maxCoinThreshold = parseInt(coinThresholdInput.value) || 160000;

      // Save configuration
      saveConfig();

      // Reset reroll state with new settings
      autoRerollState.rerollAttempts.clear();
      autoRerollState.rerollQueue.clear();

      // Close dialog
      dialog.remove();
    });

    dialog.appendChild(saveButton);
    document.body.appendChild(dialog);

    // Close dialog when clicking outside
    document.addEventListener("click", function closeDialog(e) {
      if (!dialog.contains(e.target) && e.target.id !== "RerollSettings") {
        dialog.remove();
        document.removeEventListener("click", closeDialog);
      }
    });
  }

  function showSortPriorityDialog() {
    // Remove existing dialog if any
    const existingDialog = document.querySelector("#sortPriorityDialog");
    if (existingDialog) {
      existingDialog.remove();
      return;
    }

    // Get blocked skills
    const blockedSkills = getBlockedSkills();

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

    // Create items for each task type (excluding blocked skills)
    const taskTypes = Object.keys(taskOrderIndex).filter(
      (type) => !blockedSkills.includes(type)
    );
    taskTypes
      .sort((a, b) => {
        const aOrder = globalConfig.customTaskOrder[a] || taskOrderIndex[a];
        const bOrder = globalConfig.customTaskOrder[b] || taskOrderIndex[b];
        return aOrder - bOrder;
      })
      .forEach((taskType, index) => {
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
        container.style.userSelect = "none";
        container.dataset.taskType = taskType;

        // Hover effect
        container.addEventListener("mouseenter", () => {
          if (draggedItem !== container) {
            container.style.backgroundColor = "#e9e9e9";
            container.style.transform = "translateX(5px)";
          }
        });
        container.addEventListener("mouseleave", () => {
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
        dragHandle.innerHTML = "⋮⋮";
        dragHandle.style.marginLeft = "auto";
        dragHandle.style.color = "#999";
        dragHandle.style.cursor = "move";
        container.appendChild(dragHandle);

        // Add drag and drop events
        container.addEventListener("dragstart", handleDragStart);
        container.addEventListener("dragover", handleDragOver);
        container.addEventListener("drop", handleDrop);
        container.addEventListener("dragend", handleDragEnd);

        sortableContainer.appendChild(container);
      });

    // Create save button
    const saveButton = document.createElement("button");
    saveButton.textContent = "Save";
    saveButton.setAttribute(
      "class",
      "Button_button__1Fe9z Button_small__3fqC7"
    );
    saveButton.style.width = "100%";
    saveButton.style.marginTop = "10px";
    saveButton.addEventListener("click", function () {
      // Save custom order
      const items = [...sortableContainer.querySelectorAll(".sortable-item")];
      globalConfig.customTaskOrder = {}; // Reset custom order
      items.forEach((item, index) => {
        const taskType = item.dataset.taskType;
        globalConfig.customTaskOrder[taskType] = index + 1;
      });

      // Save configuration
      saveConfig();

      // Apply changes immediately
      applyCustomOrder();

      // Close dialog
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
    this.style.opacity = "0.4";
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

    draggedItem.style.opacity = "";
    draggedItem.style.transform = "";

    const items = document.querySelectorAll(".sortable-item");
    items.forEach((item) => {
      item.style.transform = "";
      item.style.borderTop = "";
      item.style.borderBottom = "";
    });

    draggedItem = null;
  }

  function updateOrderNumbers() {
    const items = document.querySelectorAll(".sortable-item");
    items.forEach((item, index) => {
      const orderSpan = item.querySelector(".order-number");
      if (orderSpan) {
        orderSpan.textContent = (index + 1).toString();
      }
    });
  }

  function optimizeForMobile(pannel) {
    if (/Mobi|Android/i.test(navigator.userAgent)) {
      const upgradeButton = pannel.querySelector(
        "button.Button_button__1Fe9z.Button_small__3fqC7"
      );
      if (upgradeButton) {
        upgradeButton.style.display = "none";
        console.log("hide upgrade button when mobile");
      }
    }
  }

  function refresh() {
    const pannel = document.querySelector(
      "div.TasksPanel_taskSlotCount__nfhgS"
    );
    if (pannel) {
      let sortButton = pannel.querySelector("#TaskSort");
      if (!sortButton) {
        optimizeForMobile(pannel);
        addSortButtonAndStaticsBar(pannel);
        updateIconByConfig();

        // Reset sort state when panel is first loaded
        sortState.isSorted = false;

        // If auto sort is enabled, check and sort if needed
        if (globalConfig.isAutoSort) {
          setTimeout(() => {
            applyCustomOrder();
          }, 100);
        }
      }
    } else {
      return; // Not in task board
    }

    let needRefreshTaskStatics = false;
    let isTasksChanged = false;
    const taskNodes = document.querySelectorAll(
      "div.TasksPanel_taskList__2xh4k div.RandomTask_randomTask__3B9fA"
    );
    for (let node of taskNodes) {
      const coinDiv = node.querySelector(".Item_count__1HVvv");
      if (coinDiv && !coinDiv.querySelector("#taskChekerInCoin")) {
        needRefreshTaskStatics = true;
        isTasksChanged = true;

        // Remove old and add new icon
        const oldIcon = node.querySelector("#MonsterIcon");
        if (oldIcon) {
          oldIcon.remove();
        }
        const oldDungeonIcons = node.querySelectorAll("#DungeonIcon");
        oldDungeonIcons.forEach((icon) => icon.remove());

        if (globalConfig.isBattleIcon) {
          addIconToTask(node);
        }

        // Add checker
        const checker = document.createElement("div");
        checker.id = "taskChekerInCoin";
        coinDiv.appendChild(checker);
      }
    }

    // Mark as unsorted if there are changes
    if (isTasksChanged) {
      sortState.isSorted = false;
      const taskContainer = document.querySelector(
        "div.TasksPanel_taskList__2xh4k"
      );
      if (taskContainer) {
        taskContainer.removeAttribute("data-sorted");
      }

      // Auto sort if enabled and there are changes
      if (globalConfig.isAutoSort) {
        sortTasks();
      }

      // Process auto-reroll if enabled and there are changes
      if (globalConfig.autoReroll.enabled && !autoRerollState.isRunning && !autoRerollState.isStopped) {
        console.log('Auto-reroll: Triggering auto-reroll due to task changes');
        setTimeout(() => {
          // Double-check before actually calling processAutoReroll
          if (globalConfig.autoReroll.enabled && !autoRerollState.isStopped) {
            processAutoReroll();
          } else {
            console.log('Auto-reroll: Cancelled - disabled or stopped during delay');
          }
        }, 500); // Small delay to ensure DOM is updated
      } else {
        if (!globalConfig.autoReroll.enabled) {
          console.log('Auto-reroll: Skipped - disabled by user');
        } else if (autoRerollState.isStopped) {
          console.log('Auto-reroll: Skipped - stopped by user');
        } else if (autoRerollState.isRunning) {
          console.log('Auto-reroll: Skipped - already running');
        }
      }
    }

    if (needRefreshTaskStatics) {
      const battleIcon = document.querySelector("#BattleIcon #taskCount");
      if (battleIcon) {
        const battleCount = [
          ...document.querySelectorAll("div.RandomTask_randomTask__3B9fA"),
        ].filter((node) => node.querySelector("#MonsterIcon")).length;
        battleIcon.textContent = battleCount > 0 ? `*${battleCount}` : "";
      }

      Object.keys(globalConfig.dungeonConfig).forEach((dungeon) => {
        const dungeonIcon = document.querySelector(
          `#${dungeon.split("/").pop()} #taskCount`
        );
        if (dungeonIcon) {
          const dungeonCount = [
            ...document.querySelectorAll("div.RandomTask_randomTask__3B9fA"),
          ].filter((node) => {
            const dungeonIcons = node.querySelectorAll("#DungeonIcon use");
            return Array.from(dungeonIcons).some((icon) =>
              icon.getAttribute("href").includes(dungeon.split("/").pop())
            );
          }).length;
          dungeonIcon.textContent = dungeonCount > 0 ? `*${dungeonCount}` : "";
        }
      });
    }
  }

  function getRerollCost(taskElement) {
    // Tìm các nút reroll có chứa chi phí sử dụng coin
    const rerollButtons = taskElement.querySelectorAll('.RandomTask_rerollOptionsContainer__3yFjo button');
    let minCoinCost = Infinity;
    rerollButtons.forEach(button => {
      const text = button.textContent || button.innerText || '';
      // Chỉ lấy chi phí từ các tùy chọn sử dụng coin
      if (text.includes('coin')) {
        const match = text.match(/Pay\s+(\d+(?:,\d{3})*)/);
        if (match) {
          const cost = parseInt(match[1].replace(/,/g, ''), 10);
          if (cost < minCoinCost) {
            minCoinCost = cost;
          }
        }
      }
    });
    return minCoinCost === Infinity ? 0 : minCoinCost; // Trả về chi phí nhỏ nhất hoặc 0 nếu không tìm thấy
  }

  const config = { attributes: true, childList: true, subtree: true };

  const observer = new MutationObserver(function (mutationsList, observer) {
    refresh();
  });

  observer.observe(document, config);
})();

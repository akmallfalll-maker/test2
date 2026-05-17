// Ponzi Scheme Simulation Logic

// Configuration Constants
const INVESTMENT_AMOUNT = 1000;
const MONTHLY_RETURN_RATE = 0.20; // 20% promised return
const FOUNDER_CUT_RATE = 0.10; // 10% of all incoming funds

// State
let state = {
    month: 1,
    totalFunds: 0,
    totalInvestors: 1, // Starts with the founder
    founderCut: 0,
    isCollapsed: false,
    investorsByMonth: [1] // To track for visualization
};

// DOM Elements
const elTotalFunds = document.getElementById('total-funds');
const elTotalInvestors = document.getElementById('total-investors');
const elRequiredPayouts = document.getElementById('required-payouts');
const elFounderCut = document.getElementById('founder-cut');
const elStatusMsg = document.getElementById('system-status');
const pyramidContainer = document.getElementById('pyramid-container');
const explanationBox = document.getElementById('explanation-box');

// Modals
const collapseModal = document.getElementById('collapse-modal');
const finalProfit = document.getElementById('final-profit');
const finalScammed = document.getElementById('final-scammed');

// Format Currency
const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(amount);
};

// Initialization
function init() {
    state = {
        month: 1,
        totalFunds: 0,
        totalInvestors: 1, // Founder is the first "investor" (the top of the pyramid)
        founderCut: 0,
        isCollapsed: false,
        investorsByMonth: [1] 
    };

    collapseModal.classList.add('hidden');
    pyramidContainer.innerHTML = '';
    
    // Draw founder
    const levelDiv = document.createElement('div');
    levelDiv.className = 'pyramid-level';
    const dot = document.createElement('div');
    dot.className = 'investor-dot founder-dot';
    levelDiv.appendChild(dot);
    pyramidContainer.appendChild(levelDiv);

    updateUI();
    setExplanation(1);
}

// Update UI
function updateUI() {
    elTotalFunds.textContent = formatMoney(state.totalFunds);
    elTotalInvestors.textContent = state.totalInvestors - 1; // Exclude founder from "investors" count
    
    // Required payouts for the CURRENT active investors next month
    // The founder doesn't pay themselves a return, they just take the cut.
    const actualInvestors = state.totalInvestors - 1;
    const required = actualInvestors * INVESTMENT_AMOUNT * MONTHLY_RETURN_RATE;
    elRequiredPayouts.textContent = formatMoney(required);
    
    elFounderCut.textContent = formatMoney(state.founderCut);

    if (state.totalFunds < required && required > 0) {
        elRequiredPayouts.classList.replace('negative', 'danger');
        elTotalFunds.classList.replace('positive', 'danger');
        elStatusMsg.textContent = "Warning: Insufficient funds for next payout!";
        elStatusMsg.className = "status-msg danger";
    } else {
        elRequiredPayouts.classList.remove('danger');
        elTotalFunds.classList.remove('danger');
        
        if (actualInvestors === 0) {
            elStatusMsg.textContent = "System ready. Recruit investors to begin.";
            elStatusMsg.className = "status-msg";
        } else if (state.totalFunds < required * 2) {
            elStatusMsg.textContent = "Funds are getting low. Need more recruits soon.";
            elStatusMsg.className = "status-msg warning";
        } else {
            elStatusMsg.textContent = "System is stable... for now.";
            elStatusMsg.className = "status-msg";
        }
    }
}

// Explanations based on state
function setExplanation(phase) {
    if (phase === 1) {
        explanationBox.innerHTML = `<p><strong>Phase 1: The Setup.</strong> You are the founder. Recruit new investors by promising them an incredible <strong>20% monthly return</strong>. You take a 10% cut of all incoming money.</p>`;
    } else if (phase === 2) {
        explanationBox.innerHTML = `<p><strong>Phase 2: The Illusion.</strong> Early investors are getting paid! They are happy and might tell their friends. But notice how the <em>Required Payouts</em> keep growing. You MUST keep recruiting to pay them.</p>`;
    } else if (phase === 3) {
        explanationBox.innerHTML = `<p><strong>Phase 3: The Crunch.</strong> The amount you owe every month is massive. The money from new recruits is barely covering the payouts to the old ones. The math is catching up.</p>`;
    }
}

// Actions
function recruit(count) {
    if (state.isCollapsed) return;

    // Financials
    const incomingMoney = count * INVESTMENT_AMOUNT;
    const myCut = incomingMoney * FOUNDER_CUT_RATE;
    
    state.founderCut += myCut;
    state.totalFunds += (incomingMoney - myCut);
    state.totalInvestors += count;
    state.investorsByMonth.push(count);

    // Visuals
    const levelDiv = document.createElement('div');
    levelDiv.className = 'pyramid-level';
    
    // Max 30 dots per row for performance/visuals
    const dotsToShow = Math.min(count, 30);
    for (let i = 0; i < dotsToShow; i++) {
        const dot = document.createElement('div');
        dot.className = 'investor-dot';
        // slight random delay for popping effect
        dot.style.animationDelay = \`\${Math.random() * 0.2}s\`;
        levelDiv.appendChild(dot);
    }
    
    if (count > 30) {
        const plusText = document.createElement('span');
        plusText.style.color = 'var(--text-muted)';
        plusText.style.fontSize = '12px';
        plusText.style.alignSelf = 'center';
        plusText.style.marginLeft = '4px';
        plusText.textContent = \`+\${count - 30} more\`;
        levelDiv.appendChild(plusText);
    }

    pyramidContainer.appendChild(levelDiv);

    // Auto-scroll pyramid
    pyramidContainer.scrollTop = pyramidContainer.scrollHeight;

    // Update Phase explanation
    if (state.totalInvestors > 10 && state.totalInvestors < 100) setExplanation(2);
    if (state.totalInvestors >= 100) setExplanation(3);

    updateUI();
}

function advanceMonth() {
    if (state.isCollapsed) return;

    const actualInvestors = state.totalInvestors - 1;
    if (actualInvestors === 0) {
        alert("You need to recruit investors first!");
        return;
    }

    const requiredPayout = actualInvestors * INVESTMENT_AMOUNT * MONTHLY_RETURN_RATE;

    if (state.totalFunds >= requiredPayout) {
        // Success
        state.totalFunds -= requiredPayout;
        state.month++;
        updateUI();
        
        // Visual feedback for payment
        elTotalFunds.style.transform = 'scale(1.1)';
        elTotalFunds.style.color = 'var(--danger)';
        setTimeout(() => {
            elTotalFunds.style.transform = 'scale(1)';
            elTotalFunds.style.color = 'var(--success)';
        }, 300);

    } else {
        // COLLAPSE
        triggerCollapse();
    }
}

function triggerCollapse() {
    state.isCollapsed = true;
    
    // Shake effect
    document.querySelector('.app-container').style.animation = 'shake 0.5s';
    
    setTimeout(() => {
        collapseModal.classList.remove('hidden');
        finalProfit.textContent = formatMoney(state.founderCut);
        finalScammed.textContent = state.totalInvestors - 1;
    }, 600);
}

// Event Listeners
document.getElementById('btn-recruit-10').addEventListener('click', () => recruit(10));
document.getElementById('btn-recruit-50').addEventListener('click', () => recruit(50));
document.getElementById('btn-next-month').addEventListener('click', advanceMonth);
document.getElementById('btn-restart').addEventListener('click', init);

// Add shake animation to styles dynamically
const style = document.createElement('style');
style.innerHTML = \`
@keyframes shake {
  0% { transform: translate(1px, 1px) rotate(0deg); }
  10% { transform: translate(-1px, -2px) rotate(-1deg); }
  20% { transform: translate(-3px, 0px) rotate(1deg); }
  30% { transform: translate(3px, 2px) rotate(0deg); }
  40% { transform: translate(1px, -1px) rotate(1deg); }
  50% { transform: translate(-1px, 2px) rotate(-1deg); }
  60% { transform: translate(-3px, 1px) rotate(0deg); }
  70% { transform: translate(3px, 1px) rotate(-1deg); }
  80% { transform: translate(-1px, -1px) rotate(1deg); }
  90% { transform: translate(1px, 2px) rotate(0deg); }
  100% { transform: translate(1px, -2px) rotate(-1deg); }
}
\`;
document.head.appendChild(style);

// Start
init();

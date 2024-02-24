const keypadContainer = document.querySelector(`#keypad`);
const screenDisplay = document.querySelector(`#screen`);
const historyDisplay = document.querySelector(`#history`);

// Create the key layout for calculator
generateKeypad();

// Initialize global variables for calculations
let input1;
let input2;
let operation;
let calcResult;
let lastBtn;

// Regex expressions for boolean tests in updateDisplay(). These incorporate expressions for either decimal or exponential notation.
regZero = /^-?0$/;
regMinTwoDigitsOrOneDecimal = /^((?!.*e)-?\d{2,})|((?!.*e)-?\d{1,}\.(\d{1,})?)|(-?\d{1}\.?(\d{1,})?e[\+-]\d{1,})$/;
regMinOneDigit = /^((?!.*e)-?\d{1,}\.?(\d{1,})?)|(-?\d{1}\.?(\d{1,})?e[\+-]\d{1,})$/;
regMinOneDigitAndOperator = /^(((?!.*e)-?\d{1,}\.?(\d{1,})?)|(-?\d{1}\.?(\d{1,})?e[\+-]\d{1,}))\s[+-x/\^]$/;
regStartsWithOneDigit = /^((?!.*e)-?\d{1,}\.?(\d{1,})?)|(-?\d{1}\.?(\d{1,})?e[\+-]\d{1,})/;
regStartsWithNegative = /^\-/;
regEndsWithOperator = /[+-x/\^]$/;
regEndsWithEquals = /=$/;
regContainsDecimal = /\./;

// Add event listeners for keyboard functionality
// Listen for keydown and, if key matches a grid-item key then trigger action
document.addEventListener(`keydown`,(e) => {
    let keyMatch = document.querySelector(`button[data-key-match="${e.key}"]`);
    if(!keyMatch) return;
    keyMatch.classList.add('activated');
    updateDisplay(keyMatch);
});  
// Listen for keyup and, if key matches a grid-item key then remove activated class (used for ui interactivity)
document.addEventListener(`keyup`,(e) => {
    let keyMatch = document.querySelector(`button[data-key-match="${e.key}"]`);
    if(!keyMatch) return;
    keyMatch.classList.remove('activated');
}); 

function updateDisplay(btnTarget) {
    // First, address the current length of the Screen number. If it is already more than 8 characters long (including a minus sign or a decimal) and the user tries to add more characters then do nothing
    if(regMinOneDigit.test(screenDisplay.textContent) && screenDisplay.textContent.length > 7 && !btnTarget.className.includes(`operator`) && !((btnTarget.value == `=` || btnTarget.value == `Clear` || btnTarget.value == `Delete`))) {
        alert('Maximum digit count reached!');
        return;
    };

    // Next, address if Screen contains either Infinity or NaN character (only possible if previous result was NaN or Infinity). If so, clear entire display.
    if(/(Infinity|NaN)/.test(screenDisplay.textContent) || /(Infinity|NaN)/.test(historyDisplay.textContent)) {
        historyDisplay.textContent = ``;
        screenDisplay.textContent = `0`;
        return;
    }
    
    // Next address any Clear or Delete button presses
    if(btnTarget.value == `Clear`) {
        historyDisplay.textContent = ``;
        screenDisplay.textContent = `0`;
        return;
    } else if(btnTarget.value == `Delete`) {
        if(regZero.test(screenDisplay.textContent)) return;
        else if(regMinTwoDigitsOrOneDecimal.test(screenDisplay.textContent)) {
            screenDisplay.textContent = screenDisplay.textContent.slice(0,-1);
        } else {
            screenDisplay.textContent = `0`;
        }
        if(regEndsWithEquals.test(historyDisplay.textContent)) {
            historyDisplay.textContent = ``;
        }
        return;
    }

    // There should be five cases of display combinations :
    // 1. History is `` and Screen is `0`
    // If a digit key is pressed => Case 2
    // If a operator key is pressed => Case 3
    if(regZero.test(screenDisplay.textContent) && !historyDisplay.textContent) {
        if(btnTarget.className.includes(`number`)) { 
            screenDisplay.textContent = btnTarget.value;
        } else if(btnTarget.className.includes(`operator`)) {
            historyDisplay.textContent = `0 ${btnTarget.value}`;
            screenDisplay.textContent = ``;
        } else if(btnTarget.className.includes(`special`) && btnTarget.value == `.`) {
            if(!regContainsDecimal.test(screenDisplay.textContent)) {
                screenDisplay.textContent += `.`;
            } else return;
        } else if(btnTarget.className.includes(`special`) && btnTarget.value == `+/-`) {
            if(!regStartsWithNegative.test(screenDisplay.textContent)) {
                screenDisplay.textContent = `-${screenDisplay.textContent}`;
            } else {
                screenDisplay.textContent = screenDisplay.textContent.slice(1);
            };
        } else return
    } 
    // 2. History is `` and Screen is `/\d/`
    // If a digit key is pressed => Case 2
    // If a operator key is pressed => Case 3
    else if(!historyDisplay.textContent && regMinOneDigit.test(screenDisplay.textContent)) {
        if(btnTarget.className.includes(`number`)) {
            screenDisplay.textContent += btnTarget.value;
        } else if(btnTarget.className.includes(`operator`)) {
            historyDisplay.textContent = `${screenDisplay.textContent} ${btnTarget.value}`;
            screenDisplay.textContent = ``;
        } else if(btnTarget.className.includes(`special`) && btnTarget.value == `.`) {
            if(!regContainsDecimal.test(screenDisplay.textContent)) {
                screenDisplay.textContent += `.`;
            } else return;
        } else if(btnTarget.className.includes(`special`) && btnTarget.value == `%`) {
            screenDisplay.textContent = operate(`%`,screenDisplay.textContent,null);
        } else if(btnTarget.className.includes(`special`) && btnTarget.value == `Sqrt`) {
            operation = `Sqrt`;
            input1 = screenDisplay.textContent;
            calcResult = operate(operation,input1,null);
            historyDisplay.textContent = `Sqrt ${screenDisplay.textContent} =`;
            screenDisplay.textContent = calcResult;
        } else if(btnTarget.className.includes(`special`) && btnTarget.value == `+/-`) {
            if(!regStartsWithNegative.test(screenDisplay.textContent)) {
                screenDisplay.textContent = `-${screenDisplay.textContent}`;
            } else {
                screenDisplay.textContent = screenDisplay.textContent.slice(1);
            };
        } else return
    }
    // 3. History is `/\d/` + `operator` and Screen is ``
    // If a digit key is pressed => Case 4
    // If a operator key is pressed => Case 3
    else if(regMinOneDigitAndOperator.test(historyDisplay.textContent) && !screenDisplay.textContent) {
        
        if(btnTarget.className.includes(`number`)) {
            screenDisplay.textContent = btnTarget.value;
        } else if(btnTarget.className.includes(`operator`)) {
            historyDisplay.textContent = historyDisplay.textContent.replace(/[+-x/\^]$/,btnTarget.value);
        } else if(btnTarget.className.includes(`special`) && btnTarget.value == `.`) {
            screenDisplay.textContent += `0.`;
        } else if(btnTarget.className.includes(`special`) && btnTarget.value == `+/-`) {
            if(!regStartsWithNegative.test(screenDisplay.textContent)) {
                screenDisplay.textContent = `-${screenDisplay.textContent}`;
            } else {
                screenDisplay.textContent = screenDisplay.textContent.slice(1);
            };
        } else return
    }
    // 4. History is `/\d/` + `operator` and Screen is `/\d/`
    // If a digit key is pressed => Case 4
    // If a operator key is pressed => Case 3
    else if(regMinOneDigitAndOperator.test(historyDisplay.textContent) && screenDisplay.textContent) {
        if(btnTarget.className.includes(`number`)) {
            screenDisplay.textContent += btnTarget.value;
        } else if(btnTarget.className.includes(`operator`)) {
            input1 = regStartsWithOneDigit.exec(historyDisplay.textContent)[0];
            operation = regEndsWithOperator.exec(historyDisplay.textContent)[0];
            input2 = screenDisplay.textContent;
            calcResult = operate(operation,input1,input2);
            screenDisplay.textContent = ``;
            historyDisplay.textContent = `${calcResult} ${btnTarget.value}`;
        } else if(btnTarget.className.includes(`special`) && btnTarget.value == `.`) {
            if(!regContainsDecimal.test(screenDisplay.textContent)) {
                screenDisplay.textContent += `.`;
            } else return;
        } else if(btnTarget.className.includes(`special`) && btnTarget.value == `=`) {
            input1 = regStartsWithOneDigit.exec(historyDisplay.textContent)[0];
            operation = regEndsWithOperator.exec(historyDisplay.textContent)[0];
            input2 = screenDisplay.textContent;
            calcResult = operate(operation,input1,input2);
            screenDisplay.textContent = calcResult;
            historyDisplay.textContent += ` ${input2} =`;
        } else if(btnTarget.className.includes(`special`) && btnTarget.value == `%`) {
            screenDisplay.textContent = operate(`%`,screenDisplay.textContent,null);
        } else if(btnTarget.className.includes(`special`) && btnTarget.value == `Sqrt`) { 
            input1 = regStartsWithOneDigit.exec(historyDisplay.textContent)[0];
            operation = regEndsWithOperator.exec(historyDisplay.textContent)[0];
            input2 = screenDisplay.textContent;
            calcResult = operate(operation,input1,input2);
            historyDisplay.textContent = `Sqrt ${calcResult} =`;
            screenDisplay.textContent = operate(`Sqrt`,calcResult,null);
        } else if(btnTarget.className.includes(`special`) && btnTarget.value == `+/-`) {
            if(!regStartsWithNegative.test(screenDisplay.textContent)) {
                screenDisplay.textContent = `-${screenDisplay.textContent}`;
            } else {
                screenDisplay.textContent = screenDisplay.textContent.slice(1);
            };
        } else return;
    }
    // 5. History is `/\d/` + `operator` + `/\d/` + `=` and Screen is `/\d/`(result)
    // If a digit key is pressed => Case 2
    // If a operator key is pressed => Case 3
    else if(regEndsWithEquals.test(historyDisplay.textContent) && screenDisplay.textContent) {
        if(btnTarget.className.includes(`number`)) {
            historyDisplay.textContent = ``;
            screenDisplay.textContent = btnTarget.value;
        } else if(btnTarget.className.includes(`operator`)) {
            historyDisplay.textContent = `${screenDisplay.textContent} ${btnTarget.value}`
            screenDisplay.textContent = ``;
        } else if(btnTarget.className.includes(`special`) && btnTarget.value == `.`) {
            if(!regContainsDecimal.test(screenDisplay.textContent)) {
                historyDisplay.textContent = ``;
                screenDisplay.textContent += `.`;
            } else return;
        } else if(btnTarget.className.includes(`special`) && btnTarget.value == `%`) {
            historyDisplay.textContent = ``;
            screenDisplay.textContent = operate(`%`,screenDisplay.textContent,null);
        } else if(btnTarget.className.includes(`special`) && btnTarget.value == `Sqrt`) {
            historyDisplay.textContent = `Sqrt ${screenDisplay.textContent} =`;
            screenDisplay.textContent = operate(`Sqrt`,screenDisplay.textContent,null);
        } else if(btnTarget.className.includes(`special`) && btnTarget.value == `+/-`) {
            if(!regStartsWithNegative.test(screenDisplay.textContent)) {
                historyDisplay.textContent = ``;
                screenDisplay.textContent = `-${screenDisplay.textContent}`;
            } else {
                historyDisplay.textContent = ``;
                screenDisplay.textContent = screenDisplay.textContent.slice(1);
            };
        } else return;
    } 
    // Any button pressed during any of the five cases should result in one of the five cases (including itself)
}

function generateKeypad () {
    
    const btnNames = [
        `Clear`,`Delete`,`^`,`%`,`Sqrt`,`/`,`7`,`8`,`9`,`x`,`4`,`5`,`6`,`-`,`1`,`2`,`3`,`+`,`+/-`,`0`,`.`,`=`
    ];
    const keyCodes = [
        `Escape`,`Backspace`,`^`,`%`,`S`,`/`,`7`,`8`,`9`,`*`,`4`,`5`,`6`,`-`,`1`,`2`,`3`,`+`,`_`,`0`,`.`,`Enter`
    ];
    let btns = [];
    for(i = 0; i <= 21; i++) {
        btns[i] = document.createElement(`button`);
        btns[i].classList.add(`grid-item`);
        btns[i].textContent = btnNames[i];
        btns[i].dataset.keyMatch = keyCodes[i];
        btns[i].value = btnNames[i];
        
        btns[i].addEventListener(`click`,(e) => updateDisplay(e.target));
        keypadContainer.appendChild(btns[i]);

        // If btnName[i] is a digit then add `number` to btns[i] classList
        if(/^\d{1}$/.test(btnNames[i])) {
            btns[i].classList.add(`number`);
        } 
        // Else if btnNames[i] is an screen-erase method then add `erasor` to btns[i] classList
        else if(/^Clear$/.test(btnNames[i]) || /^Delete$/.test(btnNames[i])) {
            btns[i].classList.add(`erasor`);
        }
        // Else if btnNames[i] is an operator then add `operator` to btns[i] classList
        else if(!/^=$/.test(btnNames[i]) && !/^\.$/.test(btnNames[i]) && !/^\+\/-$/.test(btnNames[i]) && !/^Sqrt$/.test(btnNames[i]) && !/^%$/.test(btnNames[i])) {
            btns[i].classList.add(`operator`);
        } 
        // Else add `special` to btns[i] classList
        else {
            btns[i].classList.add(`special`);
        }
    }
}

function operate(operator,str1,str2) {
    const num1 = parseFloat(str1);
    const num2 = parseFloat(str2);
    let result;
    switch (operator) {
        case `+`:
            result = num1 + num2;
            break;
        case `-`:
            result = num1 - num2;
            break;
        case `x`:
            result = num1 * num2;
            break;
        case `/`:
            result = num1 / num2;
            break;
        case `^`:
            result = num1 ** num2;
            break;
        case `Sqrt`:
            result = Math.sqrt(num1);
            break;
        case `%`:
            result = num1 * 0.01;
            break;
        default:
            result = null;
            break;
    }
    if(!Number.isSafeInteger(result)) {
        result = parseFloat(result.toFixed(4));
    }
    if(result > 1e7) {
        result = result.toExponential(0);
    }
    return result;
}

// Generate footer
const foot = document.querySelector('footer');
const cpyrt = document.createElement('p')
cpyrt.textContent = `Copyright ${new Date().getFullYear()} skothar3`;
const gitLink = document.createElement('a')
const gitIcon = document.createElement('i')
gitLink.href = `https://github.com/skothar3`;
gitLink.target = '_blank';
gitIcon.classList.add(`fa-brands`,`fa-square-github`,`fa-lg`);

foot.appendChild(cpyrt);
foot.appendChild(gitLink)
gitLink.appendChild(gitIcon);

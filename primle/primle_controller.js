import { Controller } from "https://unpkg.com/@hotwired/stimulus/dist/stimulus.js"
import { Primle } from "./primle.js"

export class PrimleController extends Controller {
    static targets = [ "gameBoard", "keyBoard", "shareSheet" ];

    connect() {
        this.answerIndex = Math.floor(Date.now() / 86400000) % Primle.answers.length;
        this.answer = Primle.answers[this.answerIndex];
        this.previousFormattedGuesses = [];
        this.currentGuess = "";
        this.guessedCorrectly = false;
        this.updateGameBoard();
    }

    digitPressed(event) {
        this.appendDigit(event.target.innerHTML);
    }

    backspacePressed() {
        this.removeDigit();
    }

    enterPressed() {
        this.checkGuess();
    }

    sharePressed() {
        this.shareGuesses();
    }

    keyPressed(event) {
        if (event.key == 'Enter') {
            this.checkGuess();
        } else if (!isNaN(parseInt(event.key))) {
            this.appendDigit(event.key);
        }
    }

    keyUp(event) {
        if (event.key == 'Backspace') {
            this.removeDigit();
        }
    }

    appendDigit(digit) {
        if (this.currentGuess.length < 5) {
            this.currentGuess += digit;
        }
        this.updateGameBoard();
    }

    removeDigit() {
        if (this.currentGuess.length > 0) {
            this.currentGuess = this.currentGuess.substring(0, this.currentGuess.length - 1);
        }
        this.updateGameBoard();
    }

    checkGuess() {
        const formattedGuess = this.formatGuess(this.currentGuess);
        if (formattedGuess) {
            this.previousFormattedGuesses.push(formattedGuess);
            this.guessedCorrectly = formattedGuess.every((formattedCell) => formattedCell.class == "full_match");
            this.currentGuess = '';
        }
        this.updateGameBoard();
    }

    updateGameBoard() {
        let gameBoardHTML = '';

        this.previousFormattedGuesses.forEach((formattedGuess) => {
            gameBoardHTML += '<div class="row">';
            formattedGuess.forEach((formattedCell) => {
                gameBoardHTML += `<span class="cell ${formattedCell['class']}">`;
                gameBoardHTML += formattedCell['digit'];
                gameBoardHTML += '</span>';
            });
            gameBoardHTML += '</div>';
        });

        if (this.guessedCorrectly) {
            this.keyBoardTarget.classList.add("hidden")
            this.shareSheetTarget.classList.remove("hidden")
        } else {
            gameBoardHTML += '<div class="row">';
            for (let i = 0; i < 5; i += 1) {
                gameBoardHTML += `<span class="cell">`;
                if (i < this.currentGuess.length) {
                    gameBoardHTML += this.currentGuess.charAt(i);
                }
                gameBoardHTML += '</span>';
            }
            gameBoardHTML += '</div>';
        }

        this.gameBoardTarget.innerHTML = gameBoardHTML;
    }

    formatGuess(guess) {
        if (!guess || !guess.length) {
            return null;
        }

        const guessInt = parseInt(guess);
        if (guessInt < 10000 || guessInt > 99999) {
            return null;
        }

        let formattedGuess = [];
        const guessFactors = Primle.factors[guessInt];
        const answerFactors = Primle.factors[this.answer];

        for (let i = 0; i < 5; i++) {
            let formattedCell = {
                digit: guess.substring(i, i + 1),
                class: "no_match"
            }

            if (guessFactors.length == 1) {
                formattedCell.class = "prime";
            } else {
                const answerFactor = answerFactors[i];

                const matchingGuessFactor = guessFactors.find((guessFactor) => {
                    return guessFactor[0] == answerFactor[0];
                });

                if (matchingGuessFactor) {
                    if (matchingGuessFactor[1] == answerFactor[1]) {
                        formattedCell.class = "full_match";
                    } else {
                        formattedCell.class = "partial_match";
                    }
                }
            }

            formattedGuess.push(formattedCell);
        }

        return formattedGuess;
    }

    shareGuesses() {
        let shareTitle = `Primle ${this.answerIndex + 1}`;
        let shareText = `Primle ${this.answerIndex + 1} ${this.previousFormattedGuesses.length}\n`;

        this.previousFormattedGuesses.forEach((formattedGuess) => {
            shareText += "\n";
            formattedGuess.forEach((formattedCell) => {
                if (formattedCell.class == "full_match") {
                    shareText += "🟩";
                } else if (formattedCell.class == "partial_match") {
                    shareText += "🟨";
                } else {
                    shareText += "⬜";
                }
            });
        });

        const shareData = {
            title: shareTitle,
            text: shareText
        };

        if (navigator && navigator.canShare && navigator.canShare(shareData)) {
            navigator.share(shareData);
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(shareText)
                .then(() => {
                    window.alert("Results copied to clipboard.");
                })
                .catch(() => {
                    window.alert("Error while copying results.");
                });
        } else {
            window.alert("Unable to share results.");
        }
    }
}
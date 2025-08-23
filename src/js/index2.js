//****************************************************************************************
//*
//* Created by PhilippeR17 on August, 21, 2025
//*
//* Free to copy, download,...
//*
//* This script is the result of a challenge in the Scrimba Fullstack course.
//* It displays an interactive basketball scoreboard where the user can increase the
//* score of each time with a set of three buttons.
//*
//* The scoreboard app itself is quite simple, and does not in and of itself justify
//* the use of the MVC paradigm. So, quite clearly and in all honesty, the logic
//* implemented is WAY over the top.
//*
//* BUT, I wanted to accomplish a few things with this simple challenge:
//*     1. Set up a simple MVC architecture with a (relatively) clear separation of
//*        concerns between the Model, the View and the Controller;
//*     2. Implement custom events that can be fired and reacted upon;
//*     3. Implement timers with setInterval
//*
//* Regarding the first point: the separation of concerns between the Model and the Controller
//* is not 100% accurate. For instance, there is a game timer that is implemented as a state
//* variable within the Model. In a real application, I can't see that anyone with a sound
//* mind would ever do that: the Model should only keep track of the fundamentals of the
//* game, i.e., what is the duration of a quarter for the game, how many quarters,... The
//* actual timers should ideally be taken care of by the controller. In other words, the
//* controller should control the timers, and should be the party to fire off events to the
//* Model, for the Model to instruct the Controller on what to do next. Besides, while
//* the Model implemented here does control the timer for the game, the timer for the
//* game timeouts (in between quarters) is under the control of the controller. A bit of
//* an incoherence, but there you go...
//*
//* In the end, this "app" is not an exercise in style on MVC, its aim was solely to
//* remind myself of some of the fundamentals of the paradigm.
//*
//* Also, the choice was made to use js classes for the three components of the app,
//* which is also way over the top for such a simple app.
//*
//* Bottom line: remember that this is only a simple exercise, not meant to be a model of
//* sorts on MVC, events, OOP, or any other topic. It is meant to experiment and have fun
//* in the process.
//*
//****************************************************************************************

/**
 * Game Model
 *
 * Only maintains the internal state of the game:
 *    - Game duration and number of quarters
 *    - Score and fouls of the two teams
 *    - Whether game is paused or not (in between quarters and possibly if
 *      a "pause" button is implemented)
 *    - Dispatches end of game and end of quarter events
 *
 * The Model has no knowledge of the view, it only cares about its own internal state.
 */
class GameModel {

    /**
     * Set of events that can be fired off by the Model
     * It is for documentation purposes only, not used in code (although it realy
     * should be...)
     * @type {Set<any>}
     */
    static supportedEvents = new Set(
        [
            "gameStarted",
            "quarterStarted",
            "gamePaused",
            "gameUnpaused",
            "quarterEnded",
            "gameEnded"
        ]
    );

    /**
     * Constructor:
     *
     * Initializes the game: sets scores and fouls to 0, sets duration and number of
     * quarters, sets game paused, provides an events subscribers registry, and dispatches
     * the events:
     *    - gameStarted
     *    - quarterStarted
     *    - gamePaused
     *    - gameUnpaused
     *    - quarterEnded
     *    - gameEnded
     *
     * @param nrQuarters
     * @param secondsPerQuarter
     * @param secondsPerInterQuarter
     */
    constructor(
        {quarters: nrQuarters, quarterDuration: secondsPerQuarter, timeOut: secondsPerInterQuarter}
    ) {
        this.subscribers = {};
        this.nrQuarters = nrQuarters;
        this.timePerQuarter = secondsPerQuarter;
        this.secondsPerInterQuarter = secondsPerInterQuarter;
    }

    /**
     * Initialize internal state variables, dispatch the gameStarted event that the controller
     * should subscribe to, and start the first quarter of the game with a slight delay
     */
    startGame() {
        this.initGame();
        this.dispatchEvent(new Event('gameStarted'));
        setTimeout(() => {
            this.newQuarter();
        }, 1000);
    }

    /**
     * Initialize internal state variables
     */
    initGame() {
        this.quarter = 0;
        this.timer = 0;
        this.gamePaused = true;
        this.gameOver = false;
        this.homeScore = 0;
        this.guestScore = 0;
        this.homeFouls = 0;
        this.guestFouls = 0;
    }

    /**
     * Registers event listeners for the various events
     * In practice, there is only one subscriber, the controller
     *
     * @param event     Event name: gameOver or endQuarter
     * @param callback  Listener event handlers
     */
    registerEventCallback(event, callback) {
        if (!(event in this.subscribers)) {
            this.subscribers[event] = [];
        }
        this.subscribers[event].push(callback);
    }

    clearEventRegistry() {
        this.subscribers = {};
    }
    /**
     * Fire events to inform the controller that some internal state has changed,
     * warranting an action on the part of the controller
     *
     * @param event     Event name
     * @param eventData Optional data that will be sent along with the event
     */
    dispatchEvent(event, eventData) {
        if (event.type in this.subscribers) {
            this.subscribers[event.type].forEach(callback => {
                callback(event, eventData);
            });
        }
    }

    /**
     * Keeps track of the scores
     *
     * @param team    Either "home" or "guest"
     * @param points  Number of points to add to the score
     * @returns {*}   New score
     */
    updateScore(team, points) {
        let whichScore = `${team}Score`;
        this[whichScore] += points;
        return this[whichScore];
    }

    /**
     * Keeps track of the fouls of each team
     *
     * Remark: not implemented at this stage
     *
     * @param team    Either "home" or "guest"
     * @returns {*}   New number of fouls
     */
    updateFouls(team) {
        let currentFouls = this[`${team}Fouls`];
        currentFouls++;
        return currentFouls;
    }

    /**
     * Start a new quarter:
     *    - Unpause the game, to allow user to use the increment score buttons again
     *    - Reset the clock to start the timer for a new quarter
     *    - Dispacth the quarterStarted event so the controller knows what to do
     */
    newQuarter() {
        this.unPauseGame();
        this.quarter++;
        if (this.quarter > this.nrQuarters) {
            this.endGame();
            return;
        }
        this.timer = this.timePerQuarter;
        this.dispatchEvent(new Event('quarterStarted'), {
            quarter: this.quarter,
            duration: this.timePerQuarter
        });
    }

    /**
     * Decrement timer.
     * If timer gets to zero:
     *    - End the quarter if there are still more quarters to follow
     *    - End the game if we are at the end of the last quarter of the game
     * @returns {number|*}  Current timer value
     */
    updateTimer() {
        this.timer -= 1;
        if (this.timer <= 0) {
            if (this.quarter < this.nrQuarters) {
                this.endQuarter();
            } else {
                this.endGame();
            }
        }
        return this.timer;
    }

    /**
     * Ends a quater of the game:
     *      - Pause the game to prevent users from incrementing scores in between
     *        quarters
     *      - Fire off the quarterEnded event
     *
     */
    endQuarter() {
        this.pauseGame();
        this.dispatchEvent(new Event('quarterEnded'), {
            pauseDuration: this.secondsPerInterQuarter
        });
    }

    /**
     * Pausing the game has the effect of preventing user from incrementing
     * scores
     */
    pauseGame() {
        this.gamePaused = true;
    }

    /**
     * Unpausing the game reinstated the possibility to increment scores
     *
     */
    unPauseGame() {
        this.gamePaused = false;
    }

    /**
     * Is the game paused or not
     * @returns {boolean|*}
     */
    isPaused() {
        return this.gamePaused;
    }

    /**
     * Is the game over
     * @returns {boolean|*}
     */
    isOver() {
        return this.gameOver;
    }

    /**
     * End the game:
     *      - Determine the winner, if any
     *      - Fire off the gameEnded event
     */
    endGame() {
        this.gameOver = true;
        const winner =
            this.homeScore > this.guestScore
                ? "home"
                : this.guestScore > this.homeScore ? "guest" : "";
        if ("gameEnded" in this.subscribers) {
            this.dispatchEvent(new Event('gameEnded'), {winner: winner});
        }
    }

}

/**
 * The Controller, takes care of:
 *      - Giving instructions to the view on the relevant state changes
 *      - Controlling timers (for quarters and timeouts)
 *      - Listening to the view buttons (New Game and the increment scores
 *      - Reacting to the events fired off by the Model
 *
 * It also gets the game specifications from user input:
 *      - How many quarters for the game
 *      - Duration of a quarter
 *      - Duration of timeout between quarters
 *
 * The controller knows both about the Model and the View, it acts as the "go-between" for
 * them. So, the controller is informed about Model state changes, and lets the view know
 * about those changes.
 *
 */
class GameController {

    /**
     * Sets internal state to initial values, AND registers listeners for buttong
     */
    constructor() {
        this.quarters = 0;
        this.quarterDuration = 0;
        this.timeOut = 0;
        this.timerInterval = null
        this.registerListeners();
    }

    /**
     * Implements listeners for the New Game button, and the increment score buttons
     */
    registerListeners() {
        // Buttons to increment score
        document.querySelectorAll(".inc-score button").forEach((buttonEl) => {
            buttonEl.addEventListener("click", this.incrementScore.bind(this));
        });
        // Button to start game
        document.getElementById("new-game").addEventListener("click", this.startGame.bind(this));
    }

    /**
     * Ensure that the controller is informed of Model state changes through the events
     * fired off by the Model
     */
    subscribeToModelEvents() {
        this.model.registerEventCallback(
            "gameStarted", this.gameStartedHandler.bind(this),
        );
        this.model.registerEventCallback(
            "quarterStarted", this.quarterStartedHandler.bind(this)
        );
        this.model.registerEventCallback(
            "quarterEnded", this.quarterEndedHandler.bind(this)
        );
        this.model.registerEventCallback(
            "gameEnded", this.gameEndedHandler.bind(this)
        );
    }

    /**
     * Callback for the gameStarted event
     */
    gameStartedHandler() {
        this.initView();
    }

    /**
     * Callback for the quarterStarted event, receives the quarter number and its
     * duration (same duration for each quarter, let's not go even more overbaord...)
     * @param event
     * @param eventData Object with quarter number and quarter duration
     */
    quarterStartedHandler(event, eventData) {
        this.view.resetError();
        this.view.setQuarter(eventData.quarter);
        this.view.setClock(eventData.duration);
        /* The timerInterval is the one that will count the time for the quarter
           Remark: the way this is implemented is way more complex than it should
           really be. Here, every second, the Model is updated, and the new timer
           value received from the Model is then passed on to the View. In a real
           app, I doubt anyone would do this: the controller would be fully in charge
           of the timer without any Model interaction, and would tell the View about
           the new timer value.
           BUT, this experiment taught me that it is best to use clearInterval from
           within the setInteval callback. Otherwise, there might still be calls to
           the callback in the callback queue that could be processed after we expect
           there to be no more calls to the callback, leading to really difficult
           bugs to uncover and solve...
         */
        this.timerInterval = setInterval(() => {
            const newClock = this.model.updateTimer();
            this.view.setClock(newClock);
            if (newClock === 0) {
                clearInterval(this.timerInterval);
            }
        }, 1000);
        this.model.unPauseGame();
    }

    /**
     * A quarter just ended: pause the game for the game timeout duration
     *
     * @param event
     * @param eventData Object with only the pauseDuration
     */
    quarterEndedHandler(event, eventData) {
        if (eventData.pauseDuration) {
            let remainingPause = eventData.pauseDuration;
            this.view.showPause();
            this.view.setPause(remainingPause);
            // Pause the game and let the view know oh long the pause
            // is still lasting
            let pauseInterval = setInterval(() => {
                remainingPause--;
                if (remainingPause === 0) {
                    // Pause is over, throw the coffee away and get back to work!
                    clearInterval(pauseInterval);
                    // Tell the view the pause is over
                    this.view.removePause();
                    this.model.newQuarter();
                } else {
                    this.view.setPause(remainingPause);
                }
            }, 1000);
        }
    }

    /**
     * Game over, tell the view who won
     * @param event
     * @param eventData Object with the winner team name ("home" or "guest")
     */
    gameEndedHandler(event, eventData) {
        this.view.setWinner(eventData.winner);
    }

    /**
     * Reset the view to its initial state: scores to 0, fouls to 0,...
     */
    initView() {
        this.view.initView();
    }

    /**
     * Listener for the "New Game" button:
     *      - Creates a new instance of the Model and the View. In a real app,
     *        the Model and the View would most likely exist independently from
     *        the controller, i.e., the controller would receive the Model
     *        and View instances in the contructor
     *      - Subscribe to the Model events
     *      - Tell the Model OK to start game
     */
    startGame() {
        if (this.model) {
            this.model.clearEventRegistry();
        }
        this.model = null;
        this.view = null;
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        this.model = new GameModel(this.getGameSpecs());
        this.view = new GameView();
        this.subscribeToModelEvents();
        this.model.startGame();
    }

    /**
     * Increment score by 1, 2 or three points, but only if game is not paused or over
     * The team whose score is to be increased and by how many points are found
     * in the event currentTarget: the id of the button pressed by the user is, for instance,
     * "home-1", meaning, increase the score of the "home" team by 1 point.
     * @param event The event.currentTarget is the button that was pressed
     */
    incrementScore(event) {
        if (this.model.isPaused()) {
            this.view.setError("Game is paused, score is frozen until game resumes!");
            return;
        }
        if (this.model.isOver()) {
            this.view.setError("Game is over, wake up...");
            return;
        }

        const [team, points] = event.currentTarget.getAttribute("id").split("-");
        const newScore = this.model.updateScore(team, Number(points));
        this.view.setScore(team, newScore);
    }

    /**
     * Get game specifications from user input: number of quarters to play,
     * duration of one quarter, and duration of timeout between quarters
     * @returns {{quarters: number, quarterDuration: number, timeOut: number}}
     */
    getGameSpecs() {
        const quarters = document.getElementById("game-quarters").value;
        const qduration = document.getElementById("game-duration").value;
        const timeOut = document.getElementById("game-timeout").value;
        return {
            quarters: Number(quarters),
            quarterDuration: Number(qduration),
            timeOut: Number(timeOut),
        }
    }

}

/**
 * The Game view controls the front-end display: score, timers, error messages,
 * final game result.
 * The view itself does not know anything about the Model, it only knows what the
 * Controller decides to share with it.
 */
class GameView {

    /**
     * Constructor holds references to the DOM elements that the view will need
     * to interact with at one point or another in the game.
     */
    constructor() {
        this.homeScoreEl = document.getElementById("home-score");
        this.homeFoulsEl = document.getElementById("home-fouls");
        this.guestScoreEl = document.getElementById("guest-score");
        this.guestFoulsEl = document.getElementById("guest-fouls");
        this.clockEl = document.getElementById("clock");
        this.quarterEl = document.getElementById("quarter");
        this.errorEl = document.getElementById("error");
        this.pausedEl = document.getElementById("paused");
        this.pauseDurationEl = document.getElementById("pause-duration");
        this.resultEl = document.getElementById("result");
    }

    /**
     * Initialize all DOM elements of interest: scores, timer, quarter, winner
     */
    initView() {
        this.setScore("home", 0);
        this.setScore("guest", 0);
        this.setFouls("home", 0);
        this.setFouls("guest", 0);
        this.setClock(0);
        this.setQuarter("-");
        this.resetWinner();
    }

    /**
     * Set the timer value
     * @param newTimeInSeconds
     */
    setClock(newTimeInSeconds) {
        let timeString =
            `${Math.floor(newTimeInSeconds / 60).toString().padStart(2, "0")}:`;
        timeString += `${(newTimeInSeconds % 60).toString().padStart(2, "0")}`;
        this.clockEl.textContent = timeString;
    }

    /**
     * Set the quarter number, such as "Q1", "Q2",...
     * @param newQuarter
     */
    setQuarter(newQuarter) {
        this.quarterEl.textContent = `Q${newQuarter.toString()}`;
    }

    /**
     * Set the score elements to their current value
     * @param team
     * @param newScore
     */
    setScore(team, newScore) {
        if (team === 'home') {
            this.homeScoreEl.textContent = newScore.toString();
        } else {
            this.guestScoreEl.textContent = newScore.toString();
        }
    }

    /**
     * If no winner, display a message saying: NO WINNER: DRAW in red.
     * Otherwise, display a message with the name of the winner, AND
     * set the winner team name and its score to green.
     *
     * @param newWinner Winner team ("home" or "guest") or "" if no winner
     */
    setWinner(newWinner) {
        if (newWinner) {
            this.resultEl.innerText = `WINNER : ${newWinner}`;
            this.resultEl.classList.add("has-winner");
            document.getElementById(`${newWinner}-title`).classList.add("is-winner");
            document.getElementById(`${newWinner}-score`).classList.add("is-winner");
        } else {
            this.resultEl.innerText = `NO WINNER: DRAW`;
            this.resultEl.classList.add("no-winner");
        }
    }

    /**
     * When a new game is started, reset all winner related fields. Necessary, as js does not
     * know the DOM state fully.
     */
    resetWinner() {
        this.resultEl.innerText = "AWAITING RESULT";
        this.resultEl.classList.remove("has-winner");
        this.resultEl.classList.remove("no-winner");
        document.getElementById(`home-title`).classList.remove("is-winner");
        document.getElementById(`home-score`).classList.remove("is-winner");
        document.getElementById(`guest-title`).classList.remove("is-winner");
        document.getElementById(`guest-score`).classList.remove("is-winner");
    }

    /**
     * Set fouls number
     * @param team
     * @param newFouls
     */
    setFouls(team, newFouls) {
        if (team === 'home') {
            this.homeFoulsEl.textContent = newFouls.toString();
        } else {
            this.guestFoulsEl.textContent = newFouls.toString();
        }
    }

    /**
     * Unhide the Pause timer
     */
    showPause() {
        this.pausedEl.classList.add("show");
    }

    /**
     * Hide the Paus timer again, once pause is over
     */
    removePause() {
        this.pausedEl.classList.remove("show");
    }

    /**
     * Set remaining pause time in timer DOM element
     * @param duration
     */
    setPause(duration) {
        this.pauseDurationEl.textContent = duration;
    }

    /**
     * Set the error text when user tries to increment scores during pauses or after
     * the game is over
     * @param errorText
     */
    setError(errorText) {
        this.errorEl.textContent = errorText;
        this.errorEl.style.display = "block";
    }

    /**
     * Hide the error text (after setting it to "")
     */
    resetError() {
        this.errorEl.textContent = "";
        this.errorEl.style.display = "none";
    }

}


// Let's see the magic at work... Playing is as simple as clicking the New Game
// button, the controller will do the rest (how nice of him... We should really show
// how grateful we are! 🙏)
const gameDispathcer = new GameController();

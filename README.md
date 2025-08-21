# Scrimba Fullstack Course js Solo Project 1

This script is the result of a challenge in the Scrimba Fullstack course.

It displays an interactive basketball scoreboard where the user can increase the
score of each time with a set of three buttons.

The scoreboard app itself is quite simple, and does not in and of itself justify
the use of the MVC paradigm. So, quite clearly and in all honesty, the logic
implemented is WAY over the top.

BUT, I wanted to accomplish a few things with this simple challenge:

     1. Set up a simple MVC architecture with a (relatively) clear separation of
        concerns between the Model, the View and the Controller;
     2. Implement custom events that can be fired and reacted upon;
     3. Implement timers with setInterval

Regarding the first point: the separation of concerns between the Model and the Controller
is not 100% accurate. For instance, there is a game timer that is implemented as a state
variable within the Model. In a real application, I can't see that anyone with a sound
mind would ever do that: the Model should only keep track of the fundamentals of the
game, i.e., what is the duration of a quarter for the game, how many quarters,... The
actual timers should ideally be taken care of by the controller. In other words, the
controller should control the timers, and should be the party to fire off events to the
Model, for the Model to instruct the Controller on what to do next. Besides, while
the Model implemented here does control the timer for the game, the timer for the
game timeouts (in between quarters) is under the control of the controller. A bit of
an incoherence, but there you go...

In the end, this "app" is not an exercise in style on MVC, its aim was solely to
remind myself of some of the fundamentals of the paradigm.

Also, the choice was made to use js classes for the three components of the app,
which is also way over the top for such a simple app.

Bottom line: remember that this is only a simple exercise, not meant to be a model of
sorts on MVC, events, OOP, or any other topic. It is meant to experiment and have fun
in the process.
###################
# Stepper Motors  #
###################


STEPS_PER_QUARTER_REV = 1024
"""Discrete number of steps that motor will take when completeing one quarter rotation."""

STEP_DELAY = 0.002
"""Number of seconds between steps."""

STEP_SEQUENCE = [
    [1, 0, 0, 0],
    [1, 1, 0, 0],
    [0, 1, 0, 0],
    [0, 1, 1, 0],
    [0, 0, 1, 0],
    [0, 0, 1, 1],
    [0, 0, 0, 1],
    [1, 0, 0, 1],
]
"""
Step sequence for 28BYJ-48 stepper motor. Each row repersents the 4 inputs on the ULN2003
stepper driver, In1, In2, In3, In4 respectivity. The patterns energerizes the stepper motors
individual coils in the correct sequence.
"""

STEPPER_1_PINS = [17, 18, 27, 22]
"""GPIO pins used on the pi to map to the inputs of the stepper motor."""

###################
##### Buttons  ####
###################

BUTTON_1_PIN = 23
"""GPIO pin that the button is connected to on the raspberry pi."""

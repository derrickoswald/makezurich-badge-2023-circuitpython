
###
# getting cpu ID
###
import microcontroller
import binascii
print(microcontroller.cpu.uid)
# converting the bytes to a human string
device_uid = binascii.hexlify(microcontroller.cpu.uid).decode("utf-8")
print(device_uid)

###
# getting CPU temperature in C
###
import microcontroller
print(microcontroller.cpu.temperature)

###
# getting second counter, which resets to zero on every reset
# there is also a nanosecond counter time.monotonic_ns()
###
import time
print(time.monotonic()) # printing seconds
time.sleep(1) # sleep 1 second
print(time.monotonic())

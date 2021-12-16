from cifar10vgg import cifar10vgg

model = cifar10vgg(False)

model.save("trained_model.h5")

import cv2
 
#read image
src = cv2.imread('./Images/dog.png', cv2.IMREAD_UNCHANGED)

r = src.copy()
g = src.copy()
b = src.copy()
for i in range(len(src)):
    for j in range(len(src[0])):
        for c in range(3):
            if c == 0:
                g[i][j][c] = 0
                b[i][j][c] = 0
            elif c == 1:
                r[i][j][c] = 0
                b[i][j][c] = 0
            elif c == 2:
                r[i][j][c] = 0
                g[i][j][c] = 0

cv2.imwrite('./dogR.png', r)
cv2.imwrite('./dogG.png', g)
cv2.imwrite('./dogB.png', b)


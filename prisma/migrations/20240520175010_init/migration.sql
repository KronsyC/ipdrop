-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Upload" (
    "id" SERIAL NOT NULL,
    "password" TEXT,
    "ipAddr" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "sticky" BOOLEAN NOT NULL,
    "type" INTEGER NOT NULL,
    "dataId" INTEGER NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Upload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Url" (
    "id" SERIAL NOT NULL,
    "href" TEXT NOT NULL,

    CONSTRAINT "Url_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" SERIAL NOT NULL,
    "bucketHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "File_bucketHash_key" ON "File"("bucketHash");

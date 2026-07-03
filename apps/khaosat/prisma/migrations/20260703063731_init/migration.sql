-- CreateTable
CREATE TABLE "KhaoSat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tieuDe" TEXT NOT NULL,
    "header" TEXT,
    "footer" TEXT,
    "logo" TEXT,
    "background" TEXT DEFAULT '#eeecec',
    "thoiGianBatDau" DATETIME,
    "thoiGianKetThuc" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isViewKQ" BOOLEAN NOT NULL DEFAULT false,
    "isNhapThongTin" BOOLEAN NOT NULL DEFAULT false,
    "isNhapThongTinRequired" BOOLEAN NOT NULL DEFAULT false,
    "isTen" BOOLEAN NOT NULL DEFAULT false,
    "isEmail" BOOLEAN NOT NULL DEFAULT false,
    "isDienThoai" BOOLEAN NOT NULL DEFAULT false,
    "isNamSinh" BOOLEAN NOT NULL DEFAULT false,
    "isDiaChi" BOOLEAN NOT NULL DEFAULT false,
    "isGioiTinh" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "CauHoi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "khaoSatId" TEXT NOT NULL,
    "noiDung" TEXT NOT NULL,
    "maLoaiCauHoi" INTEGER NOT NULL,
    "isBatBuoc" BOOLEAN NOT NULL DEFAULT false,
    "isLyDoKhac" BOOLEAN NOT NULL DEFAULT false,
    "thuTu" INTEGER NOT NULL DEFAULT 1,
    "cauHoiChaId" TEXT,
    "soLuongTraLoiMin" INTEGER,
    "soLuongTraLoiMax" INTEGER,
    "maxLength" INTEGER,
    CONSTRAINT "CauHoi_khaoSatId_fkey" FOREIGN KEY ("khaoSatId") REFERENCES "KhaoSat" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CauHoi_cauHoiChaId_fkey" FOREIGN KEY ("cauHoiChaId") REFERENCES "CauHoi" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CauTraLoi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cauHoiId" TEXT NOT NULL,
    "noiDung" TEXT NOT NULL,
    "thuTu" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "CauTraLoi_cauHoiId_fkey" FOREIGN KEY ("cauHoiId") REFERENCES "CauHoi" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KetQua" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "khaoSatId" TEXT NOT NULL,
    "nguoiKhaoSat" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KetQua_khaoSatId_fkey" FOREIGN KEY ("khaoSatId") REFERENCES "KhaoSat" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChiTietKetQua" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ketQuaId" TEXT NOT NULL,
    "cauHoiId" TEXT NOT NULL,
    "cauTraLoiId" TEXT,
    "isKhac" BOOLEAN NOT NULL DEFAULT false,
    "noiDung" TEXT,
    CONSTRAINT "ChiTietKetQua_ketQuaId_fkey" FOREIGN KEY ("ketQuaId") REFERENCES "KetQua" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChiTietKetQua_cauHoiId_fkey" FOREIGN KEY ("cauHoiId") REFERENCES "CauHoi" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChiTietKetQua_cauTraLoiId_fkey" FOREIGN KEY ("cauTraLoiId") REFERENCES "CauTraLoi" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

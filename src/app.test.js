"use strict";
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({ log: ["query"] });

const testUser = {
  userId: 0,
  username: "testuser",
};

// Iron Session モック（作成者IDと一致させる）
function mockIronSession(userId = testUser.userId) {
  const ironSession = require("iron-session");
  jest.spyOn(ironSession, "getIronSession").mockReturnValue({
    user: { login: testUser.username, id: userId },
    save: jest.fn(),
    destroy: jest.fn(),
  });
}

// テストで作成したデータを削除
async function deleteScheduleAggregate(scheduleId) {
  const { deleteScheduleAggregate } = require("./routes/schedules");
  await deleteScheduleAggregate(scheduleId);
}

// フォームからリクエストを送信
async function sendFormRequest(app, path, body) {
  return app.request(path, {
    method: "POST",
    body: new URLSearchParams(body),
    headers: { "Content-Type": "application/x-www-form-urlencoded", 'Origin': 'http://localhost:3000' },
  });
}

// JSON リクエスト送信
async function sendJsonRequest(app, path, body) {
  return app.request(path, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

// ------- /login テスト -------
describe("/login", () => {
  beforeAll(() => mockIronSession());
  afterAll(() => jest.restoreAllMocks());

  test("ログインリンク表示", async () => {
    const app = require("./app");
    const res = await app.request("/login");
    expect(res.status).toBe(200);
    expect(await res.text()).toMatch(/<a href="\/auth\/github"/);
  });

  test("ログイン時ユーザ名表示", async () => {
    const app = require("./app");
    const res = await app.request("/login");
    expect(await res.text()).toMatch(/testuser/);
    expect(res.status).toBe(200);
  });
});

// ------- /logout テスト -------
describe("/logout", () => {
  test("/ にリダイレクト", async () => {
    const app = require("./app");
    const res = await app.request("/logout");
    expect(res.headers.get("Location")).toBe("/");
    expect(res.status).toBe(302);
  });
});

// ------- /schedules 作成テスト -------
describe("/schedules", () => {
  let scheduleId = "";
  beforeAll(() => mockIronSession());
  afterAll(async () => {
    jest.restoreAllMocks();
    if (scheduleId) await deleteScheduleAggregate(scheduleId);
  });

  test("予定作成と表示", async () => {
    await prisma.user.upsert({
      where: { userId: testUser.userId },
      create: testUser,
      update: testUser,
    });

    const app = require("./app");
    const postRes = await sendFormRequest(app, "/schedules", {
      scheduleName: "テスト予定1",
      memo: "テストメモ1",
      candidates: "候補1\n候補2",
    });

    const createdSchedulePath = postRes.headers.get("Location");
    expect(createdSchedulePath).toMatch(/schedules/);
    expect(postRes.status).toBe(302);

    scheduleId = createdSchedulePath.split("/schedules/")[1];

    const res = await app.request(createdSchedulePath);
    const body = await res.text();
    expect(body).toMatch(/テスト予定1/);
    expect(body).toMatch(/テストメモ1/);
    expect(body).toMatch(/候補1/);
    expect(body).toMatch(/候補2/);
    expect(res.status).toBe(200);
  });
});

// ------- 出欠更新テスト -------
describe("/schedules/:scheduleId/users/:userId/candidates/:candidateId", () => {
  let scheduleId = "";
  beforeAll(() => mockIronSession());
  afterAll(async () => { jest.restoreAllMocks(); if (scheduleId) await deleteScheduleAggregate(scheduleId); });

  test("出欠更新", async () => {
    await prisma.user.upsert({ where: { userId: testUser.userId }, create: testUser, update: testUser });
    const app = require("./app");

    const postRes = await sendFormRequest(app, "/schedules", {
      scheduleName: "出欠予定",
      memo: "メモ",
      candidates: "候補1",
    });

    const createdSchedulePath = postRes.headers.get("Location");
    scheduleId = createdSchedulePath.split("/schedules/")[1];

    const candidate = await prisma.candidate.findFirst({ where: { scheduleId } });

    const res = await sendJsonRequest(
      app,
      `/schedules/${scheduleId}/users/${testUser.userId}/candidates/${candidate.candidateId}`,
      { availability: 2 },
    );

    expect(await res.json()).toEqual({ status: "OK", availability: 2 });

    const availabilities = await prisma.availability.findMany({ where: { scheduleId } });
    expect(availabilities[0].availability).toBe(2);
  });
});

// ------- コメント更新テスト -------
describe("/schedules/:scheduleId/users/:userId/comments", () => {
  let scheduleId = "";
  beforeAll(() => mockIronSession());
  afterAll(async () => { jest.restoreAllMocks(); if (scheduleId) await deleteScheduleAggregate(scheduleId); });

  test("コメント更新", async () => {
    await prisma.user.upsert({ where: { userId: testUser.userId }, create: testUser, update: testUser });
    const app = require("./app");

    const postRes = await sendFormRequest(app, "/schedules", {
      scheduleName: "コメント予定",
      memo: "メモ",
      candidates: "候補1",
    });

    const createdSchedulePath = postRes.headers.get("Location");
    scheduleId = createdSchedulePath.split("/schedules/")[1];

    const res = await sendJsonRequest(
      app,
      `/schedules/${scheduleId}/users/${testUser.userId}/comments`,
      { comment: "testcomment" },
    );

    expect(await res.json()).toEqual({ status: "OK", comment: "testcomment" });

    const comments = await prisma.comment.findMany({ where: { scheduleId } });
    expect(comments[0].comment).toBe("testcomment");
  });
});

// ------- 更新テスト -------
describe("/schedules/:scheduleId/update", () => {
  let scheduleId = "";
  beforeAll(() => mockIronSession());
  afterAll(async () => { jest.restoreAllMocks(); if (scheduleId) await deleteScheduleAggregate(scheduleId); });

  test("予定更新と候補追加", async () => {
    await prisma.user.upsert({ where: { userId: testUser.userId }, create: testUser, update: testUser });
    const app = require("./app");

    const postRes = await sendFormRequest(app, "/schedules", {
      scheduleName: "更新予定1",
      memo: "更新メモ1",
      candidates: "候補1",
    });

    const createdSchedulePath = postRes.headers.get("Location");
    scheduleId = createdSchedulePath.split("/schedules/")[1];

    await sendFormRequest(app, `/schedules/${scheduleId}/update`, {
      scheduleName: "更新予定2",
      memo: "更新メモ2",
      candidates: "候補2",
    });

    const schedule = await prisma.schedule.findUnique({ where: { scheduleId } });
    expect(schedule.scheduleName).toBe("更新予定2");
    expect(schedule.memo).toBe("更新メモ2");

    const candidates = await prisma.candidate.findMany({ where: { scheduleId }, orderBy: { candidateId: "asc" } });
    expect(candidates.length).toBe(2);
    expect(candidates[0].candidateName).toBe("候補1");
    expect(candidates[1].candidateName).toBe("候補2");
  });
});
// ...existing code...
// ------- 削除テスト -------
describe("/schedules/:scheduleId/delete", () => {
  let scheduleId = "";
  beforeAll(() => mockIronSession());
  afterAll(() => jest.restoreAllMocks());

  test("全て削除できる", async () => {
    await prisma.user.upsert({ where: { userId: testUser.userId }, create: testUser, update: testUser });
    const app = require("./app");

    const postRes = await sendFormRequest(app, "/schedules", {
      scheduleName: "削除予定",
      memo: "削除メモ",
      candidates: "候補1",
    });

    const createdSchedulePath = postRes.headers.get("Location");
    scheduleId = createdSchedulePath.split("/schedules/")[1];

    // 出欠作成
    const candidate = await prisma.candidate.findFirst({ where: { scheduleId } });
    await sendJsonRequest(
      app,
      `/schedules/${scheduleId}/users/${testUser.userId}/candidates/${candidate.candidateId}`,
      { availability: 2 },
    );

    // コメント作成
    await sendJsonRequest(
      app,
      `/schedules/${scheduleId}/users/${testUser.userId}/comments`,
      { comment: "testcomment" },
    );

    // 削除
    const res = await app.request(`/schedules/${scheduleId}/delete`, {
      method: "POST",
      headers: { "Origin": "http://localhost:3000" } // ← 追加
    });
    expect(res.status).toBe(302);
// ...existing code...
    // データ確認
    const availabilities = await prisma.availability.findMany({ where: { scheduleId } });
    expect(availabilities.length).toBe(0);

    const candidates = await prisma.candidate.findMany({ where: { scheduleId } });
    expect(candidates.length).toBe(0);

    const comments = await prisma.comment.findMany({ where: { scheduleId } });
    expect(comments.length).toBe(0);

    const schedule = await prisma.schedule.findUnique({ where: { scheduleId } });
    expect(schedule).toBeNull();
  });
});

// ------- 404 Not Found テスト -------
describe("404 Not Found", () => {
  test("存在しないパスは404を返す", async () => {
    const app = require("./app");
    const res = await app.request("/not-found-path");
    expect(res.status).toBe(404);
    const body = await res.text();
    expect(body).toMatch(/Not Found/);
    expect(body).toMatch(/not-found-path/);
  });
});

// ------- CSRF テスト -------
describe("CSRF protection", () => {
  test("CSRFトークンが必要なPOSTでOriginが不正なら403", async () => {
    const app = require("./app");
    const res = await app.request("/schedules", {
      method: "POST",
      body: new URLSearchParams({
        scheduleName: "CSRF予定",
        memo: "CSRFメモ",
        candidates: "候補1"
      }),
      headers: { "Content-Type": "application/x-www-form-urlencoded", "Origin": "http://evil.com" }
    });
    expect([401, 403]).toContain(res.status);
  });
});
// ...existing code...

const Koa = require("koa");
const Router = require("koa-router");
const cors = require("@koa/cors");
const axios = require("axios");
const cheerio = require("cheerio");
const app = new Koa();
const router = new Router();
const PORT = process.env.PORT || 3000;
app.use(cors());

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    if (err.status) {
      ctx.status = err.status;
      ctx.body = { error: err.message };
    } else {
      console.error(err);
      ctx.status = 500;
      ctx.body = { error: "Internal server error" };
    }
  }
});

router.use(async (ctx, next) => {
  return next();
});

router.get("/", async (ctx, next) => {
  let $;
  console.log("request");
  await axios
    .get("https://www.ufc.com/rankings")
    .then(res => {
      $ = cheerio.load(res.data, { normalizeWhitespace: true });
    })
    .catch(err => {
      console.log(err);
    });
  let response = [];
  let weight_classes = $(".views-view-table"); // selecting all tables

  // here I am creating an object for each weight class (wc), which will contain the wc name and all fighters
  // rank 0 means champ
  weight_classes.find($(".info")).each((idx, el) => {
    let info = {};
    info["wclass"] = $(el)
      .find($("h4"))
      .text();
    info[0] = [
      $(el)
        .find($("a"))
        .text()
    ];
    response.push(info);
  });

  let rank;
  let name;
  let rank_change;
  weight_classes.find($("tbody")).each((idxTbl, table) => {
    $(table)
      .find($("tr"))
      .each((idxCell, cell) => {
        rank = $(cell)
          .find(".views-field-weight-class-rank")
          .text()
          .replace(/\s\s+/g, "");
        name = $(cell)
          .find("a")
          .text()
          .replace(/\s\s+/g, "");
        rank_change = $(cell)
          .find(".views-field-weight-class-rank-change")
          .text()
          .replace(/\s\s+/g, "");
        response[idxTbl][rank] = [name, rank_change];
      });
  });
  ctx.body = response;
  return next();
});

router.get("/favicon.ico", async (ctx, next) => {
  ctx.status = 204;
  next();
});

app.use(router.routes());

app.listen(PORT, null, () => {
  console.log("App running on port", PORT);
});

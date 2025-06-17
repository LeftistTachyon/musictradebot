import { PasteClient, ExpireDate, Publicity } from "pastebin-api";

// test
(async () => {
  const pastebinClient = new PasteClient(
    process.env.PASTEBIN_KEY ?? "missing pastebin key"
  );

  // send via DMs to everybody involved
  const url = await pastebinClient.createPaste({
    code: "# 早上好",
    expireDate: ExpireDate.Never,
    name: "something.md",
    publicity: Publicity.Public,
  });
  console.log(url);
})();

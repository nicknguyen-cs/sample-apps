import { useEffect, useState } from "react";
import { Paragraph, Heading, Button } from "@contentstack/venus-components";
import OpenAI from "openai";
import ContentstackAppSDK from "@contentstack/app-sdk";

const openai = new OpenAI({
  organization: process.env.REACT_APP_OPENAI_ORG,
  apiKey: process.env.REACT_APP_OPENAI_APIKEY,
  dangerouslyAllowBrowser: true,
});

async function openAITranslate(text: string, locale: string, mLocale: string) {
  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: `Translate the following ${mLocale} text to ${locale}: ${text}` }],
    model: "gpt-3.5-turbo",
  });

  return completion.choices[0];
}

const EntrySidebarExtension = () => {
  const [masterLocale, setMasterLocale] = useState<string>("");
  const [currentLocale, setCurrentLocale] = useState<string>("");
  const [sdk, setSDK] = useState<any>();
  const [entry, setEntry] = useState<any>();
  const [result, setResult] = useState<string>("");

  useEffect(() => {
    ContentstackAppSDK.init().then(async (appSDK: any) => {
      setSDK(appSDK);
      const sidebar = appSDK.location.SidebarWidget;
      setMasterLocale(appSDK.stack.getData().master_locale);
      setCurrentLocale(sidebar.entry.locale);
      setEntry(sidebar.entry);
    });
  }, []);

  const translate = async () => {
    const mlEntry = await sdk.stack.ContentType(entry.content_type.uid).Entry(entry.getData().uid).fetch();
    const translation = await openAITranslate(mlEntry.entry.multi_line, currentLocale, masterLocale);
    console.log(translation.message.content);
    sdk.stack
      .ContentType(entry.content_type.uid)
      .Entry(entry.getData().uid)
      .update({ entry: { multi_line: translation.message.content } }, currentLocale)
      .then((result: any) => {
        console.log(result);
        if (result.notice === "Entry updated successfully." || result.notice === "Entry localized successfully.") {
          setResult(result.notice + " Please refresh to see changes.");
        }
      });
  };

  return (
    <div className="layout-container">
      <div className="ui-location-wrapper">
        <div className="ui-location">
          <div className="ui-container">
            <Heading tagName="h2" text="Translation POC" />
            <Paragraph text={`Stack master locale: ${masterLocale}`} />
            <Paragraph text={`Entry locale: ${currentLocale}`} />
            {currentLocale !== masterLocale ? (
              <Button buttonType="primary" onClick={translate}>
                Translate
              </Button>
            ) : (
              <></>
            )}
            <Paragraph text={result} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntrySidebarExtension;
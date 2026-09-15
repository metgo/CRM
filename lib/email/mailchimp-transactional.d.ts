declare module "@mailchimp/mailchimp_transactional" {
  interface MailchimpMessage {
    from_email: string;
    from_name?: string;
    to: Array<{ email: string; type?: "to" | "cc" | "bcc" }>;
    subject: string;
    html: string;
  }

  interface MailchimpTransactionalClient {
    messages: {
      send: (args: { message: MailchimpMessage }) => Promise<unknown>;
    };
  }

  function mailchimpTx(apiKey: string): MailchimpTransactionalClient;
  export = mailchimpTx;
}

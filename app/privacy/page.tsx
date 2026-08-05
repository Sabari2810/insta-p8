export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: August 2026</p>

      <section className="space-y-4">
        <p>
          This app (&quot;Sovex&quot;) is owned and operated by <strong>Sabari Manikandan</strong>. The app uses the Instagram Graph API to help users manage
          their Instagram account, including auto-replying to comments, direct
          messages, and story interactions, and viewing analytics about that
          activity.
        </p>

        <h2 className="text-xl font-semibold mt-6">Data We Collect</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Instagram profile information (username, name, profile picture)</li>
          <li>Instagram content (media, captions, comments)</li>
          <li>Messages and conversations (for auto-reply and inbox features)</li>
          <li>Organizational labels you add yourself, such as conversation tags — these are for your own account management and are never sent to Instagram or shared with any third party</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6">How We Use Data</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>To send automated replies to comments, direct messages, and story interactions</li>
          <li>To display your live inbox and let you reply manually</li>
          <li>To display analytics about your automations' performance</li>
          <li>We do <strong>not</strong> sell your data to third parties</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6">Data Storage</h2>
        <p>
          Your Instagram access token is encrypted before being stored in our
          database (Supabase) and is only ever decrypted in memory when needed
          to call the Instagram API on your behalf. You can disconnect your
          account at any time from Settings, which clears the stored token
          immediately.
        </p>

        <h2 className="text-xl font-semibold mt-6">Contact</h2>
        <p>
          For any questions, please reach out via the app dashboard or email at imsabarimanikandan@gmail.com.
        </p>
      </section>
    </div>
  )
}

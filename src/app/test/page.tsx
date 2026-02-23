import { createClient } from "@/utils/supabase/server";

export default async function TestPage() {
    // 1. Supabase Server Client එක හදාගැනීම
    const supabase = await createClient();

    // 2. Data Fetch කිරීම (උදාහරණයක් විදිහට events table එකෙන්)
    const { data: events, error } = await supabase.from("events").select("*");

    // Error එකක් ආවොත් ඒක පෙන්නන්න
    if (error) {
        return (
            <div className="p-8 text-red-500">
                <h1>Error fetching data:</h1>
                <p>{error.message}</p>
            </div>
        );
    }

    // Data ටික පෙන්නන්න
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-white">
                Events Data from Supabase
            </h1>

            {/* Data ටික ලස්සනට JSON විදිහට print කරලා බලමු */}
            <pre className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-lg overflow-auto text-sm text-zinc-800 dark:text-zinc-200">
                {JSON.stringify(events, null, 2)}
            </pre>
        </div>
    );
}
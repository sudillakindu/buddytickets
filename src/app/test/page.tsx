import { createClient } from "@/utils/supabase/server";

export default async function TestPage() {
    const supabase = await createClient();

    const { data: users, error } = await supabase.from("users").select("*");

    if (error) {
        return (
            <div className="p-8 text-red-500">
                <h1>Error fetching data:</h1>
                <p>{error.message}</p>
            </div>
        );
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-white">
                Users Data from Supabase
            </h1>

            <pre className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-lg overflow-auto text-sm text-zinc-800 dark:text-zinc-200">
                {JSON.stringify(users, null, 2)}
            </pre>
        </div>
    );
}
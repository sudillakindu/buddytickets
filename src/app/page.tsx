import Image from "next/image";
import logoImg from "@/app/assets/images/logo/upscale_media_logo.png";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-950">
      <main className="text-center flex flex-col items-center">
        <Image
          src={logoImg}
          alt="BuddyTickets Logo"
          width={150}
          height={150}
          className="mb-6"
          priority
        />
        <h1 className="font-special text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl">
          Welcome to BuddyTickets
        </h1>
        <p className="font-secondary mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          The production-grade ticket-selling platform.
        </p>
      </main>
    </div>
  );
}
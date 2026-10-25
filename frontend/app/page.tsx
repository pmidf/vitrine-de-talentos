import { redirect } from "next/navigation";

// Provisório: a raiz leva para a galeria até a SCRUM-106 definir a entrada no site do Student Club
export default function Home() {
  redirect("/voluntarios");
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export default function Home() {
  return (
      <main className="main">
        <section className="hero">
          <div className="eyebrow">Project starter</div>
          <h1>San sang cho team bat dau phat trien.</h1>
          <p className="lead">
            Frontend, backend, PostgreSQL, TypeORM migration va cau hinh local da
            duoc dat san de team clone repo ve la co the chay tiep.
          </p>
        </section>

        <section className="grid" aria-label="Project stack">
          <article className="card">
            <h2>Frontend</h2>
            <p>Next.js App Router voi TypeScript, React va cau truc src/app.</p>
          </article>
          <article className="card">
            <h2>Backend</h2>
            <p>NestJS REST API, global validation pipe va endpoint health.</p>
          </article>
          <article className="card">
            <h2>Database</h2>
            <p>PostgreSQL qua Docker Compose, TypeORM va migration script.</p>
          </article>
        </section>

        <section className="grid" aria-label="Local endpoints">
          <article className="card">
            <h2>API URL</h2>
            <p>{apiUrl}</p>
          </article>
          <article className="card">
            <h2>Auth</h2>
            <p>JWT packages da co san de lap module auth khi co yeu cau nghiep vu.</p>
          </article>
          <article className="card">
            <h2>Migration</h2>
            <p>Chay npm run api:migration:run sau khi bat PostgreSQL.</p>
          </article>
        </section>
      </main>
  );
}


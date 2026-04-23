import { prisma } from "db";
import { revalidatePath } from "next/cache";
import { Suspense } from "react";

async function getSites() {
  return await prisma.site.findMany({
    include: {
      logs: {
        orderBy: { createdAt: 'desc' },
        take: 1
      },
    },
    orderBy: { createdAt: 'desc' }
  });
}

async function addSite(formData: FormData) {
  "use server";
  const title = formData.get("title") as string;
  const url = formData.get("url") as string;
  const instruction = formData.get("instruction") as string;

  if (title && url) {
    await prisma.site.create({
      data: {
        title,
        url,
        instruction: instruction || "Check for any updates on this page.",
      },
    });
    revalidatePath("/");
  }
}

async function deleteSite(formData: FormData) {
  "use server";
  const id = Number(formData.get("id"));
  await prisma.site.delete({
    where: { id },
  });
  revalidatePath("/");
}

async function SiteList() {
  const sites = await getSites();

  return (
    <div className="grid grid-cols-1 gap-6">
      {sites.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500 italic">
          No sites registered yet.
        </div>
      ) : (
        sites.map((site) => (
          <div key={site.id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{site.title}</h3>
                  <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">
                    {site.url}
                  </a>
                </div>
                <form action={deleteSite}>
                  <input type="hidden" name="id" value={site.id} />
                  <button type="submit" className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                </form>
              </div>

              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Instruction</h4>
                <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{site.instruction}</p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Latest Check</h4>
                {site.logs[0] ? (
                  <div className={`p-3 rounded text-sm ${site.logs[0].hasChange ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
                    <div className="flex justify-between mb-1">
                      <span className={`font-bold ${site.logs[0].hasChange ? 'text-yellow-800' : 'text-green-800'}`}>
                        {site.logs[0].hasChange ? 'Update Detected!' : 'No Changes'}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {new Date(site.logs[0].createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-700">{site.logs[0].summary}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">Never checked yet.</p>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default async function Home() {
  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <main className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">DataHarvest Admin</h1>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Register New Site</h2>
            <form action={addSite} className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Site Title</label>
                  <input
                    name="title"
                    type="text"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 text-black"
                    placeholder="My Blog"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">URL</label>
                  <input
                    name="url"
                    type="url"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 text-black"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">AI Instruction</label>
                <textarea
                  name="instruction"
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 text-black"
                  placeholder="Tell me if there are new articles or major design changes."
                />
              </div>
              <button
                type="submit"
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Register Site
              </button>
            </form>
          </section>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">Monitoring Sites</h2>
          <Suspense fallback={<div className="bg-white rounded-lg shadow p-6 text-center text-gray-500 animate-pulse">Loading sites...</div>}>
            <SiteList />
          </Suspense>
        </section>
      </main>
    </div>
  );
}

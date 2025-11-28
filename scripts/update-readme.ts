import { readFileSync, writeFileSync } from "fs";

interface Post {
  title: string;
  link: string;
  pubDate: string;
}

async function fetchLatestPosts(): Promise<Post[]> {
  const response = await fetch("https://joshhornby.com/feed.xml");
  const xml = await response.text();

  const posts: Post[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null && posts.length < 5) {
    const itemContent = match[1];

    const title = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
      || itemContent.match(/<title>(.*?)<\/title>/)?.[1]
      || "";
    const link = itemContent.match(/<link>(.*?)<\/link>/)?.[1] || "";
    const pubDate = itemContent.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";

    if (title && link) {
      posts.push({ title, link, pubDate });
    }
  }

  return posts;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function generatePostsSection(posts: Post[]): string {
  const postsList = posts
    .map((post) => `- [${post.title}](${post.link}) - ${formatDate(post.pubDate)}`)
    .join("\n");

  return `## Recent Writing

${postsList}`;
}

async function updateReadme(): Promise<void> {
  const posts = await fetchLatestPosts();

  if (posts.length === 0) {
    console.log("No posts found in feed");
    return;
  }

  console.log(`Found ${posts.length} posts`);

  const readme = readFileSync("README.md", "utf-8");
  const postsSection = generatePostsSection(posts);

  const sectionRegex = /## Recent Writing[\s\S]*?(?=\n## |$)/;

  let updatedReadme: string;
  if (sectionRegex.test(readme)) {
    updatedReadme = readme.replace(sectionRegex, postsSection);
  } else {
    updatedReadme = readme.trimEnd() + "\n\n" + postsSection + "\n";
  }

  writeFileSync("README.md", updatedReadme);
  console.log("README.md updated successfully");
}

updateReadme().catch(console.error);

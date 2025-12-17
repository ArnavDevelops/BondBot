// utils/familyTree.js
// Usage:
//   const { buildRelationshipGraph, generateAsciiFamilyTree } = require('./utils/familyTree');
//   const treeStr = await buildRelationshipGraph(startUserId, guildId, { UserModel, FamilyModel });
//   const ascii = generateAsciiFamilyTree(treeStr.graph, startUserId, { maxDepth: 10 });

const DEFAULT_STATUS_MAP = {
  married: 'Married',
  engaged: 'Engaged',
  adopted: 'Adopted',
  runaway: 'none',
  thrownAway: 'none',
  // add more custom statuses used by your bot
};

/**
 * buildRelationshipGraph(userId, guildId, opts)
 * - Crawls related users starting from userId using parentId, loveId, children and family membership
 * - Returns { graph: { id -> node }, rootId }
 *
 * Node shape:
 *  {
 *    id: String,
 *    userId: String, // same as id
 *    name: String,   // display name (userId if none)
 *    parentId: String | null,
 *    loveId: String | null,
 *    familyId: String | null,
 *    status: String | null,
 *    familyFlags: { incest, engagement, disown } // from family doc if any
 *    children: [] // filled after graph built
 *  }
 *
 * opts:
 *   - UserModel (mongoose model) - required
 *   - FamilyModel - required
 *   - nameField (string) - optional field to use as display name (default userId)
 *   - maxNodes - safety limit (default 2000)
 */
async function buildRelationshipGraph(startUserId, guildId, opts = {}) {
  const { UserModel, FamilyModel, nameField = 'userId', maxNodes = 2000 } = opts;
  if (!UserModel || !FamilyModel) throw new Error('UserModel and FamilyModel required in opts');

  // helpers
  const toId = (v) => (v == null ? null : String(v));
  const seen = new Set();
  const graph = {}; // id -> node
  const queue = [];

  // start from startUserId
  queue.push(toId(startUserId));

  // small cache for family flags
  const familyCache = {};

  // BFS crawl
  while (queue.length && Object.keys(graph).length < maxNodes) {
    const currentId = queue.shift();
    if (!currentId || seen.has(currentId)) continue;
    seen.add(currentId);

    // try fetch user by userId and guildId (some bots use unique userId within guild)
    const userDoc = await UserModel.findOne({ userId: currentId, guildId }).lean().exec();
    if (!userDoc) {
      // sometimes a loveId or parentId might point to a user from a different guild or missing - still create placeholder
      graph[currentId] = {
        id: currentId,
        userId: currentId,
        name: currentId,
        parentId: null,
        loveId: null,
        familyId: null,
        status: null,
        familyFlags: {},
        children: [],
      };
      continue;
    }

    const uid = toId(userDoc.userId);
    const parentId = toId(userDoc.parentId);
    const loveId = toId(userDoc.loveId);
    const familyId = userDoc.familyId ? toId(userDoc.familyId) : null;
    const status = userDoc.status || null;
    let familyFlags = {};

    if (familyId) {
      if (familyCache[familyId]) familyFlags = familyCache[familyId];
      else {
        const fam = await FamilyModel.findById(familyId).lean().exec();
        if (fam) {
          familyFlags = {
            incest: !!fam.incest,
            engagement: !!fam.engagement,
            disown: !!fam.disown,
            familyName: fam.name || null,
            ownerId: fam.ownerId ? String(fam.ownerId) : null,
            familyMembers: Array.isArray(fam.familyMembers) ? fam.familyMembers.map(x => String(x.id ?? x)) : [],
          };
        } else {
          familyFlags = {};
        }
        familyCache[familyId] = familyFlags;
      }
    }

    // build node
    graph[uid] = {
      id: uid,
      userId: uid,
      name: userDoc[nameField] || userDoc.username || uid,
      parentId,
      loveId,
      familyId,
      status,
      familyFlags,
      children: [], // will fill later
    };

    // Enqueue linked ids: parent, love
    if (parentId && !seen.has(parentId)) queue.push(parentId);
    if (loveId && !seen.has(loveId)) queue.push(loveId);

    // find children (users whose parentId == uid) - limit to guild
    const childrenDocs = await UserModel.find({ parentId: uid, guildId }).lean().exec();
    for (const c of childrenDocs) {
      const cid = toId(c.userId);
      if (!graph[cid]) {
        // push child to queue to fetch properly
        if (!seen.has(cid)) queue.push(cid);
      }
    }

    // also add family members if family available (this makes tree include siblings etc.)
    if (familyFlags.familyMembers && familyFlags.familyMembers.length) {
      for (const mem of familyFlags.familyMembers) {
        // mem can be object {id: '...'} or string
        const memId = toId(mem.id ?? mem);
        if (memId && !seen.has(memId)) queue.push(memId);
      }
    }
  } // end BFS

  // second pass: fill children arrays from graph (any node that references node.id as parentId)
  for (const id of Object.keys(graph)) {
    const node = graph[id];
    for (const otherId of Object.keys(graph)) {
      if (graph[otherId].parentId && String(graph[otherId].parentId) === id) {
        node.children.push(otherId);
      }
    }
    // unique
    node.children = [...new Set(node.children)];
  }

  return { graph, rootId: String(startUserId) };
}

/**
 * generateAsciiFamilyTree(graph, rootId, opts)
 * - graph: object returned from buildRelationshipGraph.graph
 * - rootId: starting id for rendering (string)
 * - opts:
 *     - statusMap: map of status->label (defaults provided)
 *     - maxDepth: number
 *     - indent: string (default two spaces '  ')
 *
 * Returns single string (ASCII tree).
 */
function generateAsciiFamilyTree(graph, rootId, opts = {}) {
  const statusMap = opts.statusMap || DEFAULT_STATUS_MAP;
  const maxDepth = Number(opts.maxDepth ?? 50);
  const indentUnit = opts.indent ?? '   ';

  const toDisplay = (node) => {
    const s = node.status ? (statusMap[node.status] || node.status) : null;
    const fam = node.familyFlags && node.familyFlags.familyName ? ` [family: ${node.familyFlags.familyName}]` : '';
    const spouseName = node.loveId && graph[node.loveId] ? ` ⧉ ${graph[node.loveId].name}` : (node.loveId ? ` ⧉ ${node.loveId}` : '');
    return `${node.name}${s ? ` (${s})` : ''}${spouseName}${fam}`;
  };

  // render with cycle-detection and cross-link printing
  const lines = [];
  const printed = new Set();

  function render(nodeId, prefix = '', isLast = true, visited = new Set(), depth = 0) {
    const node = graph[nodeId];
    const connector = prefix ? (isLast ? '└─ ' : '├─ ') : '';
    if (!node) {
      lines.push(prefix + connector + `[missing:${nodeId}]`);
      return;
    }

    lines.push(prefix + connector + toDisplay(node));

    // if already visited on this branch -> cycle
    if (visited.has(nodeId)) {
      lines.push(prefix + (isLast ? '   ' : '│  ') + `↳ (cycle / cross-link to earlier node)`);
      return;
    }

    if (depth >= maxDepth) {
      lines.push(prefix + (isLast ? '   ' : '│  ') + `↳ (max depth reached)`);
      return;
    }

    // mark visited for this branch
    const newVisited = new Set(visited);
    newVisited.add(nodeId);

    // children first (biological)
    const children = node.children || [];

    const nextPrefix = prefix + (prefix ? (isLast ? '   ' : '│  ') : '');
    for (let i = 0; i < children.length; i++) {
      const childId = children[i];
      const childIsLast = i === children.length - 1 && (!node.loveId || !graph[node.loveId]);
      // if child is ancestor (in visited) print cross-link
      if (newVisited.has(childId)) {
        lines.push(nextPrefix + (childIsLast ? '└─ ' : '├─ ') + `${graph[childId] ? graph[childId].name : childId} ↳ (incest / cross-link)`);
      } else {
        render(childId, nextPrefix, childIsLast, newVisited, depth + 1);
      }
    }

    // print spouse/partner branch if exists and not printed in children
    if (node.loveId) {
      const spouse = graph[node.loveId];
      const spouseLinePrefix = prefix + (isLast ? '   ' : '│  ');
      // If spouse was printed deeper in subtree already, show cross link
      if (!spouse) {
        lines.push(spouseLinePrefix + '└─ ' + `Spouse: ${node.loveId}`);
      } else {
        // If spouse is in visited -> cross link
        if (newVisited.has(spouse.id)) {
          lines.push(spouseLinePrefix + '└─ ' + `Spouse: ${spouse.loveId} ↳ (cross-link)`);
        } else {
          // render spouse as a shallow node with their children (to show both sides)
          // We'll render spouse with children, but do not descend into spouse's spouse (avoid mirror)
          lines.push(spouseLinePrefix + '└─ ' + `Spouse: ${spouse.loveId}}` + (spouse.status ? ` (${statusMap[spouse.status] || spouse.status})` : ''));
          // spouse's children (that are not already printed in node.children)
          const spouseChildren = (spouse.children || []).filter(c => !(node.children || []).includes(c));
          const spousePrefix = spouseLinePrefix + (spouseChildren.length ? '   ' : '   ');
          for (let j = 0; j < spouseChildren.length; j++) {
            const cid = spouseChildren[j];
            const lastChild = j === spouseChildren.length - 1;
            if (newVisited.has(cid)) {
              lines.push(spousePrefix + (lastChild ? '└─ ' : '├─ ') + `${graph[cid] ? graph[cid].name : cid} ↳ (cross-link)`);
            } else {
              render(cid, spousePrefix, lastChild, new Set(newVisited).add(spouse.id), depth + 2);
            }
          }
        }
      }
    }
  }

  render(String(rootId), '', true, new Set(), 0);
  return lines.join('\n');
}

module.exports = {
  buildRelationshipGraph,
  generateAsciiFamilyTree,
};

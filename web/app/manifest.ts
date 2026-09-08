import type { MetadataRoute } from 'next'
import { MIMISEE_MARK_PATH } from '@/lib/brand'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MimiSee',
    short_name: 'MimiSee',
    description: 'Inspectable, replaceable, regression-tested enterprise RAG infrastructure',
    start_url: '/',
    display: 'standalone',
    background_color: '#f4fbff',
    theme_color: '#55c7f3',
    icons: [
      {
        src: MIMISEE_MARK_PATH,
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}

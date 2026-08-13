"use client";

import { useState, useEffect } from "react";
import { secureFetch } from "@/lib/crypto";
import { FileText, Clock } from "lucide-react";
import styles from "./patchnotes.module.css";
import { motion } from "framer-motion";

export default function PatchnotesPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    secureFetch('/api-bot/patchnotes')
      .then(r => r.json())
      .then(data => {
        setNotes(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2><FileText className={styles.titleIcon} /> Patchnotes</h2>
        <p>Restez informé des dernières nouveautés et corrections de PrimeGen.</p>
      </div>

      <div className={styles.timeline}>
        {loading ? (
          <div className={styles.loading}>Chargement des patchnotes...</div>
        ) : notes.length === 0 ? (
          <div className={styles.empty}>Aucun patchnote trouvé.</div>
        ) : (
          notes.map((note, idx) => (
            <motion.div 
              key={note.id} 
              className={styles.noteCard}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className={styles.noteHeader}>
                <div className={styles.author}>
                  <img src={note.authorAvatar} alt={note.authorName} className={styles.avatar} />
                  <span>{note.authorName}</span>
                </div>
                <div className={styles.date}>
                  <Clock size={14} />
                  <span>{new Date(note.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
              <div className={styles.noteContent}>
                {note.content.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

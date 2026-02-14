'use client'

import { useState } from 'react'

interface ExplainableAIDashboardProps {
  decisionId?: string
  decisionData?: {
    action: string
    confidence: number
    reasoning: string
    factors: Array<{ name: string; weight: number; impact: string }>
    alternatives: Array<{ action: string; confidence: number; reason: string }>
  }
}

export default function ExplainableAIDashboard({ decisionId, decisionData }: ExplainableAIDashboardProps) {
  const [selectedFactor, setSelectedFactor] = useState<string | null>(null)

  // Sample data if not provided
  const data = decisionData || {
    action: "Continue tracking target",
    confidence: 0.87,
    reasoning: "Target is moving predictably within acceptable parameters. All sensors confirm target identity with high confidence.",
    factors: [
      { name: "Target Confidence", weight: 0.35, impact: "High - Target identification is certain" },
      { name: "Trajectory Predictability", weight: 0.25, impact: "Medium - Target following expected path" },
      { name: "Sensor Agreement", weight: 0.20, impact: "High - All sensors confirm target" },
      { name: "Environmental Conditions", weight: 0.10, impact: "Low - Clear visibility, no interference" },
      { name: "Mission Priority", weight: 0.10, impact: "Medium - Target is high priority" }
    ],
    alternatives: [
      { action: "Increase tracking distance", confidence: 0.65, reason: "Lower confidence, more conservative approach" },
      { action: "Request human confirmation", confidence: 0.45, reason: "Safety protocol, but not necessary" },
      { action: "Switch to backup sensor", confidence: 0.30, reason: "Current sensors performing well" }
    ]
  }

  return (
    <div className="card-glass p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">AI Decision Explanation</h2>
        {decisionId && (
          <span className="text-sm text-slate-400">Decision ID: {decisionId}</span>
        )}
      </div>

      {/* Main Decision */}
      <div className="mb-6 p-4 glass border border-blue-500/30 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Selected Action</h3>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded-lg">
              <span className="text-sm font-semibold text-blue-300">
                {typeof data.confidence === 'number' && !isNaN(data.confidence)
                  ? (data.confidence * 100).toFixed(1)
                  : '0.0'}% Confidence
              </span>
            </div>
          </div>
        </div>
        <p className="text-white font-semibold mb-2">{data.action}</p>
        <p className="text-sm text-slate-300">{data.reasoning}</p>
      </div>

      {/* Decision Factors */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Decision Factors</h3>
        <div className="space-y-3">
          {data.factors.map((factor, index) => (
            <div
              key={index}
              className="glass border border-white/10 rounded-lg p-4 hover:border-blue-500/50 transition-colors cursor-pointer"
              onClick={() => setSelectedFactor(selectedFactor === factor.name ? null : factor.name)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-white">{factor.name}</span>
                <span className="text-sm text-slate-400">
                  {typeof factor.weight === 'number' && !isNaN(factor.weight)
                    ? (factor.weight * 100).toFixed(0)
                    : '0'}% weight
                </span>
              </div>
              <div className="relative w-full h-2 glass border border-white/10 rounded-full overflow-hidden mb-2">
                <div
                  className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                  style={{ 
                    width: `${typeof factor.weight === 'number' && !isNaN(factor.weight)
                      ? factor.weight * 100
                      : 0}%` 
                  }}
                />
              </div>
              <p className="text-sm text-slate-300">{factor.impact}</p>
              {selectedFactor === factor.name && (
                <div className="mt-3 p-3 glass border border-blue-500/30 rounded-lg">
                  <p className="text-xs text-slate-400">
                    This factor contributed {typeof factor.weight === 'number' && !isNaN(factor.weight)
                      ? (factor.weight * 100).toFixed(1)
                      : '0.0'}% to the final decision.
                    {factor.impact && typeof factor.impact === 'string' && factor.impact.includes("High") && " This was a critical consideration."}
                    {factor.impact && typeof factor.impact === 'string' && factor.impact.includes("Medium") && " This was a moderate consideration."}
                    {factor.impact && typeof factor.impact === 'string' && factor.impact.includes("Low") && " This had minimal impact."}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Alternative Actions */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Alternative Actions Considered</h3>
        <div className="space-y-3">
          {data.alternatives.map((alt, index) => (
            <div key={index} className="glass border border-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-300">{alt.action}</span>
                <span className="text-sm text-slate-400">
                  {(alt.confidence * 100).toFixed(0)}% confidence
                </span>
              </div>
              <p className="text-sm text-slate-400">{alt.reason}</p>
              <div className="mt-2 relative w-full h-1 glass border border-white/10 rounded-full overflow-hidden">
                <div
                  className="absolute inset-0 bg-gradient-to-r from-slate-500 to-slate-400"
                  style={{ 
                    width: `${typeof alt.confidence === 'number' && !isNaN(alt.confidence)
                      ? Math.min(100, Math.max(0, alt.confidence * 100))
                      : 0}%` 
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Decision Tree Visualization */}
      <div className="mt-6 p-4 glass border border-white/10 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4">Decision Process</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-slate-300">1. Analyzed sensor inputs</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-slate-300">2. Evaluated target confidence</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-slate-300">3. Checked trajectory predictability</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-slate-300">4. Verified sensor agreement</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-slate-300">5. Applied safety constraints</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span className="text-white font-semibold">6. Selected optimal action</span>
          </div>
        </div>
      </div>
    </div>
  )
}

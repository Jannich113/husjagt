package dk.husjagt.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dk.husjagt.data.BoligsidenClient
import dk.husjagt.data.Listing
import dk.husjagt.data.SearchFilters
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ListingsUiState(
    val filters: SearchFilters = SearchFilters(),
    val listings: List<Listing> = emptyList(),
    val totalHits: Int = 0,
    val loading: Boolean = false,
    val error: String? = null,
    val savedIds: Set<String> = emptySet(),
)

class ListingsViewModel(
    private val client: BoligsidenClient = BoligsidenClient(),
) : ViewModel() {
    private val _state = MutableStateFlow(ListingsUiState(loading = true))
    val state: StateFlow<ListingsUiState> = _state

    init { refresh() }

    fun refresh(filters: SearchFilters = _state.value.filters) {
        _state.update { it.copy(filters = filters, loading = true, error = null) }
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val result = client.search(filters)
                _state.update {
                    it.copy(listings = result.listings, totalHits = result.totalHits, loading = false)
                }
            } catch (e: Exception) {
                _state.update { it.copy(loading = false, error = e.message ?: "Kunne ikke hente boliger") }
            }
        }
    }

    fun toggleSaved(id: String) {
        _state.update { current ->
            val next = current.savedIds.toMutableSet()
            if (!next.add(id)) next.remove(id)
            current.copy(savedIds = next)
        }
    }
}

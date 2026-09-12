package dk.husjagt.ui

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ArrowBack
import androidx.compose.material.icons.outlined.Favorite
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.Tune
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import coil.compose.AsyncImage
import dk.husjagt.data.EnergyLabels
import dk.husjagt.data.KOMMUNER
import dk.husjagt.data.Listing
import dk.husjagt.data.PropertyTypes
import dk.husjagt.data.SearchFilters
import dk.husjagt.data.SortOptions
import java.text.NumberFormat
import java.util.Locale

private val dk = Locale("da", "DK")
private val krFormat = NumberFormat.getCurrencyInstance(dk).apply { maximumFractionDigits = 0 }
private val intFormat = NumberFormat.getIntegerInstance(dk)

@Composable
fun HusjagtRoot(vm: ListingsViewModel = viewModel()) {
    val nav = rememberNavController()
    NavHost(navController = nav, startDestination = "list") {
        composable("list") { ListingsScreen(vm, nav) }
        composable("detail/{id}") { entry ->
            val id = entry.arguments?.getString("id")
            val listing = vm.state.collectAsState().value.listings.find { it.id == id }
            if (listing == null) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("Boligen blev ikke fundet")
                }
            } else {
                DetailScreen(listing, vm, nav)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ListingsScreen(vm: ListingsViewModel, nav: NavHostController) {
    val state by vm.state.collectAsState()
    var showFilters by remember { mutableStateOf(false) }
    val kommune = KOMMUNER.find { it.slug == state.filters.municipality }?.name ?: state.filters.municipality
    val extra = state.filters.advancedCount

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Husjagt", fontWeight = FontWeight.SemiBold)
                        Text(
                            "$kommune · max ${state.filters.priceMax?.let { krFormat.format(it) } ?: "—"}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                },
                actions = {
                    IconButton(onClick = { showFilters = true }) {
                        Box {
                            Icon(Icons.Outlined.Tune, contentDescription = "Filtre")
                            if (extra > 0) {
                                Text(
                                    extra.toString(),
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.align(Alignment.TopEnd),
                                )
                            }
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background),
            )
        },
    ) { padding ->
        when {
            state.loading && state.listings.isEmpty() -> Box(
                Modifier.fillMaxSize().padding(padding),
                contentAlignment = Alignment.Center,
            ) { CircularProgressIndicator() }
            state.error != null && state.listings.isEmpty() -> Column(
                Modifier.fillMaxSize().padding(padding).padding(24.dp),
                verticalArrangement = Arrangement.Center,
            ) {
                Text(state.error ?: "")
                Spacer(Modifier.height(12.dp))
                Button(onClick = { vm.refresh() }) { Text("Prøv igen") }
            }
            else -> LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                item {
                    Text(
                        "${state.totalHits} boliger · Boligsiden (home, Nybolig, EDC, danbolig, Estate…)",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                items(state.listings, key = { it.id }) { listing ->
                    HouseRow(
                        listing = listing,
                        saved = listing.id in state.savedIds,
                        onOpen = { nav.navigate("detail/${listing.id}") },
                        onSave = { vm.toggleSaved(listing.id) },
                    )
                }
            }
        }
    }

    if (showFilters) {
        FilterSheet(
            current = state.filters,
            onDismiss = { showFilters = false },
            onApply = {
                showFilters = false
                vm.refresh(it)
            },
        )
    }
}

@Composable
private fun HouseRow(
    listing: Listing,
    saved: Boolean,
    onOpen: () -> Unit,
    onSave: () -> Unit,
) {
    Column(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(MaterialTheme.colorScheme.surface)
            .clickable(onClick = onOpen),
    ) {
        AsyncImage(
            model = listing.image,
            contentDescription = listing.street,
            contentScale = ContentScale.Crop,
            modifier = Modifier.fillMaxWidth().aspectRatio(16f / 10f),
        )
        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.Top) {
            Column(Modifier.weight(1f)) {
                Text(listing.price?.let { krFormat.format(it) } ?: "Pris uoplyst", fontWeight = FontWeight.SemiBold)
                Text(listing.street, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(
                    "${listing.zip} ${listing.city}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Text(
                    listOfNotNull(
                        listing.area?.let { "$it m²" },
                        listing.rooms?.let { "$it vær." },
                        listing.energy?.uppercase(),
                        listing.agency,
                    ).joinToString(" · "),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            IconButton(onClick = onSave) {
                Icon(
                    if (saved) Icons.Outlined.Favorite else Icons.Outlined.FavoriteBorder,
                    contentDescription = "Gem",
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DetailScreen(listing: Listing, vm: ListingsViewModel, nav: NavHostController) {
    val saved = listing.id in vm.state.collectAsState().value.savedIds
    val context = LocalContext.current
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(listing.street, maxLines = 1, overflow = TextOverflow.Ellipsis) },
                navigationIcon = {
                    IconButton(onClick = { nav.popBackStack() }) {
                        Icon(Icons.Outlined.ArrowBack, contentDescription = "Tilbage")
                    }
                },
                actions = {
                    IconButton(onClick = { vm.toggleSaved(listing.id) }) {
                        Icon(if (saved) Icons.Outlined.Favorite else Icons.Outlined.FavoriteBorder, contentDescription = "Gem")
                    }
                },
            )
        },
    ) { padding ->
        LazyColumn(Modifier.fillMaxSize().padding(padding)) {
            item {
                AsyncImage(
                    model = listing.image,
                    contentDescription = listing.street,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxWidth().aspectRatio(16f / 10f),
                )
            }
            item {
                Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(listing.price?.let { krFormat.format(it) } ?: "Pris uoplyst", style = MaterialTheme.typography.headlineMedium)
                    Text("${listing.zip} ${listing.city}")
                    Text(
                        listOfNotNull(
                            listing.area?.let { "$it m²" },
                            listing.rooms?.let { "$it værelser" },
                            listing.lot?.let { "grund $it m²" },
                            listing.year?.let { "bygget $it" },
                            listing.energy?.let { "energi $it" },
                            listing.days?.let { "$it dage på markedet" },
                        ).joinToString(" · "),
                    )
                    Text(listing.agency ?: "Ukendt mægler")
                    Spacer(Modifier.height(8.dp))
                    Button(onClick = {
                        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(listing.boligsidenUrl)))
                    }) { Text("Åbn originalt opslag") }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
private fun FilterSheet(
    current: SearchFilters,
    onDismiss: () -> Unit,
    onApply: (SearchFilters) -> Unit,
) {
    var draft by remember { mutableStateOf(current) }
    var query by remember { mutableStateOf("") }
    val sheet = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val kommuner = KOMMUNER.filter {
        query.isBlank() || it.name.contains(query, true) || it.slug.contains(query, true)
    }

    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = sheet) {
        Column(
            Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp)
                .padding(bottom = 28.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text("Søgning", style = MaterialTheme.typography.headlineSmall)
                TextButton(onClick = { draft = SearchFilters() }) { Text("Nulstil") }
            }
            OutlinedTextField(
                value = query,
                onValueChange = { query = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Kommune") },
                placeholder = { Text(KOMMUNER.find { it.slug == draft.municipality }?.name ?: "Odense") },
            )
            ChipRow {
                kommuner.take(12).forEach { k ->
                    FilterChip(
                        selected = draft.municipality == k.slug,
                        onClick = { draft = draft.copy(municipality = k.slug); query = k.name },
                        label = { Text(k.name) },
                    )
                }
            }
            Text("Boligtype")
            ChipRow {
                PropertyTypes.all.forEach { (id, label) ->
                    FilterChip(
                        selected = id in draft.types,
                        onClick = {
                            val next = draft.types.toMutableList()
                            if (!next.remove(id)) next += id
                            if (next.isNotEmpty()) draft = draft.copy(types = next)
                        },
                        label = { Text(label) },
                    )
                }
            }
            Text("Makspris")
            ChipRow {
                listOf(1_000_000, 2_000_000, 3_000_000, 5_000_000, null).forEach { price ->
                    FilterChip(
                        selected = draft.priceMax == price,
                        onClick = { draft = draft.copy(priceMax = price) },
                        label = { Text(price?.let { krFormat.format(it) } ?: "Ingen grænse") },
                    )
                }
            }
            Text("Min. værelser")
            ChipRow {
                listOf(null, 3, 4, 5).forEach { n ->
                    FilterChip(
                        selected = draft.roomsMin == n,
                        onClick = { draft = draft.copy(roomsMin = n) },
                        label = { Text(n?.let { "$it+" } ?: "Alle") },
                    )
                }
            }
            Text("Min. m²")
            ChipRow {
                listOf(null, 80, 120, 150).forEach { n ->
                    FilterChip(
                        selected = draft.areaMin == n,
                        onClick = { draft = draft.copy(areaMin = n) },
                        label = { Text(n?.let { "$it+" } ?: "Alle") },
                    )
                }
            }

            Text("Avanceret", style = MaterialTheme.typography.titleMedium)

            Text("Min. pris")
            ChipRow {
                listOf(null, 250_000, 500_000, 1_000_000).forEach { n ->
                    FilterChip(
                        selected = draft.priceMin == n,
                        onClick = { draft = draft.copy(priceMin = n) },
                        label = { Text(n?.let { krFormat.format(it) } ?: "Alle") },
                    )
                }
            }
            Text("Energimærke")
            ChipRow {
                EnergyLabels.all.forEach { letter ->
                    val selected = letter in draft.energyLabels
                    FilterChip(
                        selected = selected,
                        onClick = {
                            val next = draft.energyLabels.toMutableList()
                            if (!next.remove(letter)) next += letter
                            draft = draft.copy(energyLabels = next)
                        },
                        label = { Text(letter) },
                    )
                }
            }
            Text("Bygget efter")
            ChipRow {
                listOf(null, 1950, 1970, 1990, 2000, 2010).forEach { n ->
                    FilterChip(
                        selected = draft.yearFrom == n,
                        onClick = { draft = draft.copy(yearFrom = n) },
                        label = { Text(n?.toString() ?: "Alle") },
                    )
                }
            }
            Text("Bygget før")
            ChipRow {
                listOf(null, 1980, 2000, 2010, 2020).forEach { n ->
                    FilterChip(
                        selected = draft.yearTo == n,
                        onClick = { draft = draft.copy(yearTo = n) },
                        label = { Text(n?.toString() ?: "Alle") },
                    )
                }
            }
            Text("Maks. værelser")
            ChipRow {
                listOf(null, 4, 5, 6).forEach { n ->
                    FilterChip(
                        selected = draft.roomsMax == n,
                        onClick = { draft = draft.copy(roomsMax = n) },
                        label = { Text(n?.toString() ?: "Alle") },
                    )
                }
            }
            Text("Maks. m²")
            ChipRow {
                listOf(null, 100, 150, 200).forEach { n ->
                    FilterChip(
                        selected = draft.areaMax == n,
                        onClick = { draft = draft.copy(areaMax = n) },
                        label = { Text(n?.toString() ?: "Alle") },
                    )
                }
            }
            Text("Min. grund")
            ChipRow {
                listOf(null, 400, 600, 800, 1000).forEach { n ->
                    FilterChip(
                        selected = draft.lotMin == n,
                        onClick = { draft = draft.copy(lotMin = n) },
                        label = { Text(n?.let { "$it+ m²" } ?: "Alle") },
                    )
                }
            }
            Text("Maks. grund")
            ChipRow {
                listOf(null, 400, 600, 800, 1200).forEach { n ->
                    FilterChip(
                        selected = draft.lotMax == n,
                        onClick = { draft = draft.copy(lotMax = n) },
                        label = { Text(n?.let { "$it m²" } ?: "Alle") },
                    )
                }
            }
            Text("Maks. ejerudgift / md")
            ChipRow {
                listOf(null, 2_000, 3_000, 4_000, 5_000).forEach { n ->
                    FilterChip(
                        selected = draft.expenseMax == n,
                        onClick = { draft = draft.copy(expenseMax = n) },
                        label = { Text(n?.let { "${intFormat.format(it)} kr" } ?: "Alle") },
                    )
                }
            }
            Text("Maks. m²-pris")
            ChipRow {
                listOf(null, 10_000, 15_000, 20_000, 25_000).forEach { n ->
                    FilterChip(
                        selected = draft.m2PriceMax == n,
                        onClick = { draft = draft.copy(m2PriceMax = n) },
                        label = { Text(n?.let { "${intFormat.format(it)} kr" } ?: "Alle") },
                    )
                }
            }
            Text("Maks. liggetid")
            ChipRow {
                listOf(null, 14, 30, 60, 90).forEach { n ->
                    FilterChip(
                        selected = draft.daysMax == n,
                        onClick = { draft = draft.copy(daysMax = n) },
                        label = { Text(n?.let { "$it dage" } ?: "Alle") },
                    )
                }
            }
            OutlinedTextField(
                value = draft.zipCode.orEmpty(),
                onValueChange = { draft = draft.copy(zipCode = it.filter { ch -> ch.isDigit() }.take(4).ifBlank { null }) },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Postnr.") },
                placeholder = { Text("fx 5000") },
                singleLine = true,
            )
            OutlinedTextField(
                value = draft.city.orEmpty(),
                onValueChange = { draft = draft.copy(city = it.ifBlank { null }) },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("By") },
                placeholder = { Text("fx Odense C") },
                singleLine = true,
            )
            Text("Faciliteter")
            ChipRow {
                FilterChip(
                    selected = draft.basement,
                    onClick = { draft = draft.copy(basement = !draft.basement) },
                    label = { Text("Kælder") },
                )
                FilterChip(
                    selected = draft.balcony,
                    onClick = { draft = draft.copy(balcony = !draft.balcony) },
                    label = { Text("Altan") },
                )
                FilterChip(
                    selected = draft.terrace,
                    onClick = { draft = draft.copy(terrace = !draft.terrace) },
                    label = { Text("Terrasse") },
                )
                FilterChip(
                    selected = draft.elevator,
                    onClick = { draft = draft.copy(elevator = !draft.elevator) },
                    label = { Text("Elevator") },
                )
                FilterChip(
                    selected = draft.priceDropOnly,
                    onClick = { draft = draft.copy(priceDropOnly = !draft.priceDropOnly) },
                    label = { Text("Kun prisfald") },
                )
            }
            Text("Sortér")
            ChipRow {
                SortOptions.all.forEach { (id, ascending, label) ->
                    FilterChip(
                        selected = draft.sortBy == id && draft.sortAscending == ascending,
                        onClick = { draft = draft.copy(sortBy = id, sortAscending = ascending) },
                        label = { Text(label) },
                    )
                }
            }
            Button(onClick = { onApply(draft) }, modifier = Modifier.fillMaxWidth()) {
                Text("Vis boliger")
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun ChipRow(content: @Composable () -> Unit) {
    FlowRow(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
        content = { content() },
    )
}
